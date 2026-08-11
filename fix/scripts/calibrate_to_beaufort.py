#!/usr/bin/env python3
import argparse, json, math, re, csv, copy
from pathlib import Path
import numpy as np
import requests
from shapely.geometry import shape, Polygon, MultiPolygon, mapping
from pyproj import Transformer

SERVICE='https://gis.beaufortcountysc.gov/server/rest/services/Hosted/AddressParcels/FeatureServer/1/query'
TO_SC=Transformer.from_crs('EPSG:4326','EPSG:2273',always_xy=True)
TO_WGS=Transformer.from_crs('EPSG:2273','EPSG:4326',always_xy=True)

def norm(v):
    if v is None: return ''
    s=str(v).upper().strip()
    s=re.sub(r'[^A-Z0-9]','',s)
    return s.lstrip('0') or ('0' if s else '')

def project_geom(g):
    def tx(coords):
        if isinstance(coords[0], (int,float)):
            x,y=TO_SC.transform(coords[0],coords[1]); return [x,y]
        return [tx(c) for c in coords]
    return {'type':g['type'],'coordinates':tx(g['coordinates'])}

def esri_rings_to_shape(rings):
    # ArcGIS rings: exterior clockwise, holes counterclockwise. Build robustly by containment.
    polys=[]
    ring_polys=[]
    for r in rings or []:
        if len(r)<4: continue
        try:
            p=Polygon(r)
            if not p.is_valid: p=p.buffer(0)
            if not p.is_empty: ring_polys.append((r,p))
        except Exception: pass
    ring_polys.sort(key=lambda rp: rp[1].area, reverse=True)
    used=set()
    for i,(r,p) in enumerate(ring_polys):
        if i in used: continue
        holes=[]
        for j,(r2,p2) in enumerate(ring_polys):
            if j==i or j in used: continue
            if p.contains(p2.representative_point()):
                # only immediate-ish contained rings as holes; nested islands are rare in parcels
                holes.append(r2); used.add(j)
        try: polys.append(Polygon(r, holes))
        except Exception: polys.append(p)
    if not polys: return None
    return polys[0] if len(polys)==1 else MultiPolygon(polys)

def fetch_county(bounds, out_json):
    west,south,east,north=bounds
    params={
      'where':'1=1','geometry':f'{west},{south},{east},{north}',
      'geometryType':'esriGeometryEnvelope','inSR':'4326',
      'spatialRel':'esriSpatialRelIntersects',
      'outFields':'objectid,pin_,lot_num,dmp,situsaddress,plan_subdivision,community,dev_lot,dev_phase,editdate',
      'returnGeometry':'true','outSR':'2273','returnZ':'false','f':'json',
      'resultRecordCount':'2000'
    }
    r=requests.get(SERVICE,params=params,timeout=60)
    r.raise_for_status(); data=r.json()
    if 'error' in data: raise RuntimeError(data['error'])
    Path(out_json).write_text(json.dumps(data,indent=2))
    return data

def fit_translation(src,dst):
    d=(dst-src).mean(axis=0)
    return ('translation', np.array([[1,0,d[0]],[0,1,d[1]]],float))

def fit_similarity(src,dst):
    A=[]; b=[]
    for (x,y),(X,Y) in zip(src,dst):
        A.append([x,-y,1,0]); b.append(X)
        A.append([y, x,0,1]); b.append(Y)
    a,beta,tx,ty=np.linalg.lstsq(np.array(A),np.array(b),rcond=None)[0]
    return ('similarity', np.array([[a,-beta,tx],[beta,a,ty]],float))

def fit_affine(src,dst):
    A=[]; b=[]
    for (x,y),(X,Y) in zip(src,dst):
        A.append([x,y,1,0,0,0]); b.append(X)
        A.append([0,0,0,x,y,1]); b.append(Y)
    c=np.linalg.lstsq(np.array(A),np.array(b),rcond=None)[0]
    return ('affine', np.array([[c[0],c[1],c[2]],[c[3],c[4],c[5]]],float))

def apply_M(P,M):
    return np.c_[P,np.ones(len(P))] @ M.T

def metrics(src,dst,M):
    e=np.linalg.norm(apply_M(src,M)-dst,axis=1)
    return {'n':len(e),'median_ft':float(np.median(e)),'rmse_ft':float(np.sqrt(np.mean(e*e))),
            'p95_ft':float(np.percentile(e,95)),'max_ft':float(e.max())}

def choose_model(ms):
    # Prefer simpler transform unless the next model materially improves withheld median error.
    chosen='translation'
    if ms['similarity']['median_ft'] < ms['translation']['median_ft']*0.85: chosen='similarity'
    base=ms[chosen]['median_ft']
    if ms['affine']['median_ft'] < base*0.85: chosen='affine'
    return chosen

def transform_geometry(g,M):
    def tx(coords):
        if isinstance(coords[0],(int,float)):
            x,y=TO_SC.transform(coords[0],coords[1])
            X,Y=(np.array([x,y,1.0])@M.T).tolist()
            lon,lat=TO_WGS.transform(X,Y)
            return [round(lon,9),round(lat,9)]
        return [tx(c) for c in coords]
    return {'type':g['type'],'coordinates':tx(g['coordinates'])}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--faces',default='data/master-parcel-faces.geojson')
    ap.add_argument('--output',default='output')
    ap.add_argument('--county-json',default='')
    args=ap.parse_args(); out=Path(args.output); out.mkdir(parents=True,exist_ok=True)
    faces=json.load(open(args.faces))
    # infer bounds + 0.003 deg buffer
    xs=[]; ys=[]
    for f in faces['features']:
        def walk(c):
            if isinstance(c[0],(int,float)): xs.append(c[0]);ys.append(c[1])
            else:
                for z in c: walk(z)
        walk(f['geometry']['coordinates'])
    bounds=(min(xs)-.003,min(ys)-.003,max(xs)+.003,max(ys)+.003)
    county=json.load(open(args.county_json)) if args.county_json else fetch_county(bounds,out/'beaufort-county-habersham.json')
    cands=[]
    for cf in county.get('features',[]):
        g=esri_rings_to_shape(cf.get('geometry',{}).get('rings',[]))
        if not g or g.is_empty: continue
        a=cf.get('attributes',{})
        cands.append({'geom':g,'cent':g.centroid,'lot':norm(a.get('lot_num') or a.get('dev_lot')),
                      'dmp':norm(a.get('dmp')),'attrs':a})
    by_dmp={}
    by_lot={}
    for c in cands:
        if c['dmp']: by_dmp.setdefault(c['dmp'],[]).append(c)
        if c['lot']: by_lot.setdefault(c['lot'],[]).append(c)
    matches=[]
    for f in faces['features']:
        p=f.get('properties',{}); gd=shape(project_geom(f['geometry'])); cen=gd.centroid
        dmps=[norm(x) for x in p.get('reference_dmp_numbers',[]) if norm(x)]
        lots=[norm(x) for x in p.get('reference_lot_numbers',[]) if norm(x)]
        pool=[]; method=''
        for d in dmps: pool.extend(by_dmp.get(d,[]))
        if pool: method='dmp'
        else:
            for l in lots: pool.extend(by_lot.get(l,[]))
            if pool: method='lot'
        # dedupe candidates by objectid
        uniq={str(c['attrs'].get('objectid')):c for c in pool}; pool=list(uniq.values())
        if not pool: continue
        c=min(pool,key=lambda q:cen.distance(q['cent']))
        dist=cen.distance(c['cent'])
        # Current misregistration should still be local; reject implausible same-number matches.
        if dist>350: continue
        matches.append({'face':f,'county':c,'method':method,'pre_dist_ft':dist,
                        'src':[cen.x,cen.y],'dst':[c['cent'].x,c['cent'].y]})
    if len(matches)<20: raise RuntimeError(f'Only {len(matches)} reliable matches found; manual review required.')
    # Spatial deterministic holdout: sort by x+y and take every fifth match.
    matches.sort(key=lambda m:(m['src'][0]+m['src'][1],m['src'][0]))
    test_idx=set(range(0,len(matches),5)); train=[m for i,m in enumerate(matches) if i not in test_idx]; test=[m for i,m in enumerate(matches) if i in test_idx]
    S=np.array([m['src'] for m in train]); D=np.array([m['dst'] for m in train])
    ST=np.array([m['src'] for m in test]); DT=np.array([m['dst'] for m in test])
    fits=dict([fit_translation(S,D),fit_similarity(S,D),fit_affine(S,D)])
    test_metrics={k:metrics(ST,DT,M) for k,M in fits.items()}
    train_metrics={k:metrics(S,D,M) for k,M in fits.items()}
    chosen=choose_model(test_metrics); M=fits[chosen]
    # Output all candidate transformed registries plus recommended.
    for name,mat in fits.items():
        fc=copy.deepcopy(faces)
        for f in fc['features']:
            f['geometry']=transform_geometry(f['geometry'],mat)
            f.setdefault('properties',{})['geolocation_calibration']=f'beaufort-county-{name}'
        (out/f'master-parcel-faces.county-{name}.geojson').write_text(json.dumps(fc,separators=(',',':')))
    (out/'master-parcel-faces.CANDIDATE.geojson').write_text((out/f'master-parcel-faces.county-{chosen}.geojson').read_text())
    report={'county_service':SERVICE,'county_authority_crs':'EPSG:2273','source_face_count':len(faces['features']),
            'county_feature_count':len(cands),'matched_face_count':len(matches),'training_count':len(train),'holdout_count':len(test),
            'training_metrics':train_metrics,'holdout_metrics':test_metrics,'recommended_model':chosen,'matrix':M.tolist(),
            'IMPORTANT':'Candidate only. Visually QA against County GIS and master-plan-2025.webp before replacing production geometry.'}
    (out/'calibration-report.json').write_text(json.dumps(report,indent=2))
    with open(out/'match-audit.csv','w',newline='') as fp:
        w=csv.writer(fp); w.writerow(['face_id','match_method','reference_lots','reference_dmps','county_objectid','county_lot','county_dmp','pre_transform_centroid_distance_ft','holdout'])
        for i,m in enumerate(matches):
            p=m['face']['properties']; a=m['county']['attrs']
            w.writerow([p.get('face_id'),m['method'],'|'.join(p.get('reference_lot_numbers',[])),'|'.join(p.get('reference_dmp_numbers',[])),a.get('objectid'),a.get('lot_num'),a.get('dmp'),round(m['pre_dist_ft'],2),i in test_idx])
    print(json.dumps(report,indent=2))

if __name__=='__main__': main()
