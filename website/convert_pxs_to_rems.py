import os
import sys
import re

walk_dir = sys.argv[1]

print('walk_dir = ' + walk_dir)
print('walk_dir (absolute) = ' + os.path.abspath(walk_dir))

for root, subdirs, files in os.walk(walk_dir):
    for filename in files:
        print(filename)
        file_path = os.path.join(root, filename)

        f = open(file_path, 'r')
        f_content = f.read()
        f.close()

        result = ""

        start = 0
        match = re.search("[0-9]+px", f_content)

        while match != None:
            result += f_content[start:start + match.start()]
            pixels = f_content[start + match.start():start + match.end()]
            new = float(int(pixels[:-2])) / 16
            result += f"{new}rem"
            
            start += match.end()
            match = re.search("[0-9]+px", f_content[start:])

        result += f_content[start:]

        f = open(file_path, 'w')
        f.write(result)
        f.close()
