import os
import re

UI_DIR = "frontend/src/components/ui"
os.makedirs(UI_DIR, exist_ok=True)

CARD_TSX = """export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`bg-white border border-black/5 shadow-sm ${className}`}>{children}</div>;
}"""

with open(os.path.join(UI_DIR, "Card.tsx"), "w") as f:
    f.write(CARD_TSX)

dashboard_path = "frontend/src/app/dashboard/page.tsx"
with open(dashboard_path, "r") as f:
    content = f.read()

# Add import
if "from \"@/components/ui/Card\"" not in content:
    content = content.replace("import { Header } from \"@/components/Navigation\";", 
                              "import { Header } from \"@/components/Navigation\";\nimport { Card } from \"@/components/ui/Card\";")

# Replace pattern: <div className="bg-white border border-black/5 ... shadow-sm ...">
# We will just do a simpler manual replacement for the biggest offenders
content = content.replace(
    'className="bg-white border border-black/5 p-6 rounded-[28px] shadow-sm flex items-center gap-4.5"',
    'className="p-6 rounded-[28px] flex items-center gap-4.5"'
)
content = content.replace(
    'className="bg-white border border-black/5 p-6 rounded-[32px] lg:col-span-2 flex flex-col shadow-sm"',
    'className="p-6 rounded-[32px] lg:col-span-2 flex flex-col"'
)
content = content.replace(
    'className="bg-white border border-black/5 p-6 rounded-[32px] flex flex-col shadow-sm"',
    'className="p-6 rounded-[32px] flex flex-col"'
)
content = content.replace(
    'className="bg-white border border-black/5 p-8 rounded-[36px] shadow-sm text-left"',
    'className="p-8 rounded-[36px] text-left"'
)
content = content.replace(
    'className="bg-white border border-black/5 rounded-[32px] overflow-hidden shadow-sm"',
    'className="rounded-[32px] overflow-hidden"'
)

# Replace <div with <Card for those specific lines.
# Actually, a regex might be better for general cases, but exact matches are safer to avoid breaking the system!
content = re.sub(r'<div\s+key=\{idx\}\s+className="p-6 rounded-\[28px\] flex items-center gap-4.5">',
                 r'<Card key={idx} className="p-6 rounded-[28px] flex items-center gap-4.5">', content)
content = re.sub(r'<div className="p-6 rounded-\[32px\] lg:col-span-2 flex flex-col">',
                 r'<Card className="p-6 rounded-[32px] lg:col-span-2 flex flex-col">', content)
content = re.sub(r'<div className="p-6 rounded-\[32px\] flex flex-col">',
                 r'<Card className="p-6 rounded-[32px] flex flex-col">', content)
content = re.sub(r'<div className="p-8 rounded-\[36px\] text-left">',
                 r'<Card className="p-8 rounded-[36px] text-left">', content)
content = re.sub(r'<div className="rounded-\[32px\] overflow-hidden">',
                 r'<Card className="rounded-[32px] overflow-hidden">', content)
# Ensure closing tags are updated. This requires parsing or being careful. 
# It's safer to just let me use multi_replace_file_content!
