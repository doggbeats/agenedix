import sys
path = sys.argv[1]
line_no = int(sys.argv[2])
ins = sys.argv[3]
lines = open(path, encoding='utf-8').read().splitlines(keepends=True)
if not ins.endswith('\n'):
    ins += '\n'
lines.insert(line_no - 1, ins)
open(path, 'w', encoding='utf-8').write(''.join(lines))
print('done')
