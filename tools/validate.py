#!/usr/bin/env python3
"""NOVA Skin — validador estático (sin dependencias externas)."""
import json, os, re, sys

NOVA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ERRS = 0

def err(msg):
    global ERRS; ERRS += 1; print(f"  FAIL  {msg}")

def ok(msg):
    print(f"  OK    {msg}")

def strip_comments(css):
    return re.sub(r'/\*.*?\*/', '', css, flags=re.S)

def core_tokens():
    core = open(os.path.join(NOVA, 'nova.css')).read()
    return list(dict.fromkeys(m.group(1) for m in re.finditer(r'(--nova-[a-z0-9-]+):', core)))

def check_css():
    print("\n--- CSS ---")
    files = ['nova.css']
    for f in sorted(os.listdir(os.path.join(NOVA, 'themes'))):
        if f.endswith('.css'):
            files.append(f'themes/{f}')
    for rel in files:
        css = open(os.path.join(NOVA, rel)).read()
        clean = strip_comments(css)
        balanced = clean.count('{') == clean.count('}')
        clean_no_kf = re.sub(r'@keyframes[^{]*\{[^}]*\}\s*\}', 'KF', clean)
        unprefixed = []
        for m in re.finditer(r'([^{}]+)\{', clean_no_kf):
            sel = m.group(1).strip()
            if sel.startswith('@') or sel in ('KF',):
                continue
            for s in sel.split(','):
                ss = s.strip()
                if ss and 'html.nova-skin-active' not in ss and '%' not in ss:
                    unprefixed.append(ss[:60])
        name = rel.split('/')[-1]
        status = 'OK' if (balanced and not unprefixed) else 'FAIL'
        if status == 'FAIL':
            if not balanced: err(f"{name}: llaves desbalanceadas")
            if unprefixed: err(f"{name}: selectores sin prefijar: {unprefixed}")
        else:
            ok(name)

def check_themes():
    print("\n--- THEME SCHEMA ---")
    core_defs = set(core_tokens())
    for f in sorted(os.listdir(os.path.join(NOVA, 'themes'))):
        if not f.endswith('.css') or f.startswith('_'):
            continue
        css = open(os.path.join(NOVA, 'themes', f)).read()
        clean = strip_comments(css)
        rule_count = len(re.findall(r'\{', clean))
        clean_no_kf = re.sub(r'@keyframes[^{]*\{[^}]*\}\s*\}', '', clean)
        non_custom = re.findall(r'(?<!--)(?:color-scheme|background|border|font)', clean_no_kf)
        ok_name = True
        if rule_count != 1:
            err(f"{f}: {rule_count} bloques; esperado 1"); ok_name = False
        tokens_used = set(m.group(0) for m in re.finditer(r'--nova-[a-z0-9-]+', clean))
        undefined = tokens_used - core_defs
        if undefined:
            err(f"{f}: tokens no definidos en core: {undefined}"); ok_name = False
        if ok_name:
            ok(f"{f} ({len(tokens_used)} tokens)")

def check_consistency():
    print("\n--- CROSS-CONSISTENCY ---")
    manifest = json.load(open(os.path.join(NOVA, 'manifest.json')))
    m_files = [p.split('/')[-1].replace('.css','')
               for p in manifest['content_scripts'][0]['css']
               if p.startswith('themes/')]
    content = open(os.path.join(NOVA, 'content.js')).read()
    cm = re.search(r'THEMES\s*=\s*\[(.*?)\];', content, flags=re.S)
    c_themes = re.findall(r'"([a-z][a-z0-9-]*)"', cm.group(1)) if cm else []
    popup = open(os.path.join(NOVA, 'popup.js')).read()
    p_themes = re.findall(r'id:\s*"([a-z][a-z0-9-]*[a-z0-9])"', popup)
    m_set, c_set, p_set = set(m_files), set(c_themes), set(p_themes)
    # "nova" is in content+popup but lives in core, not themes/
    if m_set == c_set and c_set == p_set:
        ok("8 temas consistentes (manifest ↔ content ↔ popup)")
    elif m_set | {"nova"} == c_set and c_set == p_set:
        ok("8 temas consistentes (nova en core, themes en manifest)")
    else:
        err(f"desajuste: manifest={m_set}, content={c_set}, popup={p_set}")

def check_versions():
    print("\n--- VERSIONES ---")
    manifest = json.load(open(os.path.join(NOVA, 'manifest.json')))
    mv = manifest['version']
    popup = open(os.path.join(NOVA, 'popup.html')).read()
    pv = re.search(r'version[^>]*>v([\d.]+)', popup)
    pv = pv.group(1) if pv else None
    if mv == pv:
        ok(f"manifest v{mv} == popup v{pv}")
    else:
        err(f"desajuste: manifest v{mv}, popup v{pv or '?'}")

def check_console():
    print("\n--- DEBUG LOGS ---")
    for name in ('content.js', 'popup.js'):
        code = open(os.path.join(NOVA, name)).read()
        hits = [(i+1, l.strip()) for i, l in enumerate(code.split('\n')) if 'console.' in l]
        if hits:
            for ln, l in hits:
                err(f"{name}:{ln}: {l[:70]}")
        else:
            ok(name)

def check_manifest():
    print("\n--- MANIFEST ---")
    m = json.load(open(os.path.join(NOVA, 'manifest.json')))
    all_refs = (m['content_scripts'][0]['css'] +
                m['content_scripts'][0]['js'] +
                [m['action']['default_popup']] +
                list(m.get('icons', {}).values()) +
                list(m['action'].get('default_icon', {}).values()))
    missing = [r for r in all_refs if not os.path.exists(os.path.join(NOVA, r))]
    if missing:
        err(f"rutas fantasma: {missing}")
    else:
        ok(f"{len(all_refs)} rutas verificadas")

if __name__ == '__main__':
    print(f"NOVA Skin QA — {NOVA}")
    check_manifest()
    check_css()
    check_themes()
    check_consistency()
    check_versions()
    check_console()
    print(f"\n{'PASS ✓' if ERRS == 0 else f'{ERRS} error(es)'}")
    sys.exit(1 if ERRS else 0)