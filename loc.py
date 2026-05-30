import os
import glob

def main():
    extensions = ['*.py', '*.ts', '*.tsx', '*.css']
    total_lines = 0
    files = []
    
    # scan backend/app
    for ext in extensions:
        files.extend(glob.glob('backend/app/**/' + ext, recursive=True))
    
    # scan frontend/src
    for ext in extensions:
        files.extend(glob.glob('frontend/src/**/' + ext, recursive=True))
        
    # filter duplicates and non-files
    files = list(set([os.path.abspath(f) for f in files if os.path.isfile(f)]))
    
    results = []
    for f in sorted(files):
        try:
            with open(f, 'r', encoding='utf-8') as fh:
                lines = fh.readlines()
                l_count = len(lines)
                results.append((f, l_count))
                total_lines += l_count
        except Exception as e:
            print(f"Error reading {f}: {e}")
            
    # sort by line count descending
    results.sort(key=lambda x: x[1], reverse=True)
    
    workspace_root = os.path.abspath('.')
    for path, count in results:
        rel_path = os.path.relpath(path, workspace_root)
        print(f"{rel_path}: {count} lines")
        
    print(f"\nTotal Line Count: {total_lines}")

if __name__ == '__main__':
    main()
