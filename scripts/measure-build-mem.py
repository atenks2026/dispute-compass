#!/usr/bin/env python3
"""Measure peak RSS (MB) of the bun/node/next process tree during install + build.
Mimics what Render free tier (512 MB) must survive."""
import os, re, subprocess, sys, time

KEY = re.compile(r'bun|node|next|turbopack|prisma', re.I)

def tree_rss_kb():
    total = 0
    for pid in os.listdir('/proc'):
        if not pid.isdigit():
            continue
        try:
            with open(f'/proc/{pid}/cmdline', 'rb') as f:
                cmd = f.read(400).replace(b'\x00', b' ').decode('utf-8', 'ignore')
            if not KEY.search(cmd):
                continue
            with open(f'/proc/{pid}/status') as f:
                for line in f:
                    if line.startswith('VmRSS:'):
                        total += int(line.split()[1])
                        break
        except (OSError, ValueError):
            continue
    return total

def phase(label, cmd):
    peak_base = tree_rss_kb()   # includes unrelated node/bun procs; we report delta
    base = peak_base
    peak = base
    t0 = time.time()
    p = subprocess.Popen(cmd, shell=True, cwd='/home/z/my-project',
                         stdout=open(f'/tmp/{label}.log', 'w'),
                         stderr=subprocess.STDOUT)
    while p.poll() is None:
        rss = tree_rss_kb()
        peak = max(peak, rss)
        time.sleep(1)
    wall = time.time() - t0
    print(f"[{label}] exit={p.returncode} wall={wall:.0f}s "
          f"base={base/1024:.0f}MB peak={peak/1024:.0f}MB delta={(peak-base)/1024:.0f}MB")
    return p.returncode

if __name__ == '__main__':
    wrap = ' '.join(sys.argv[1:])  # optional: e.g. "taskset -c 0"
    print(f"baseline bun/node/next RSS: {tree_rss_kb()/1024:.0f} MB")
    subprocess.run('rm -rf /home/z/my-project/.next', shell=True)
    c1 = phase('install', f'{wrap} bun install --frozen-lockfile --silent'.strip())
    c2 = phase('build', f'{wrap} bun run build'.strip())
    print('BUILD OK' if (c1 == 0 and c2 == 0) else f'BUILD FAILED install={c1} build={c2}')
    tail = open('/tmp/build.log').read().splitlines()[-8:]
    print('\n'.join(tail))
