import os,sys,subprocess,re

def have(c):
    try: subprocess.check_output([c,'--version']); return True
    except: return False

def ver_ok():
    try: v=subprocess.check_output(['node','-v'], text=True).strip()
    except: return False
    nums=[int(x) for x in re.findall(r'\d+', v)]; return nums and nums[0]>=18

def ensure_env():
    if os.path.exists('.env.local'): return
    if os.path.exists('.env.local.example'):
        open('.env.local','w',encoding='utf-8').write(open('.env.local.example','r',encoding='utf-8').read())
        print('📄 Created .env.local from .env.local.example (fill your keys).')

print('🚀 Runner')
if not have('node') or not have('npm') or not ver_ok():
    print('❌ Need Node.js v18+'); sys.exit(1)
ensure_env()
if not os.path.exists('node_modules'):
    subprocess.check_call(['npm','install'])
subprocess.call(['npm','run','dev'])
