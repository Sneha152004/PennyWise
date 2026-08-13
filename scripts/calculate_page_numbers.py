import os
import docx
import xml.etree.ElementTree as ET

docx_path = os.path.join(os.path.dirname(__file__), '..', 'report', 'PennyWise_Final_Project_Report.docx')
doc = docx.Document(docx_path)

namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

current_page = 1
paragraph_pages = {}

print("=== TRACKING PAGE BREAKS & SECTIONS ===")
for p_idx, p in enumerate(doc.paragraphs):
    # Check for page breaks in runs
    p_xml = p._element
    has_page_break = False
    for br in p_xml.findall('.//w:br', namespaces):
        if br.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type') == 'page':
            has_page_break = True
            current_page += 1

    paragraph_pages[p_idx] = current_page
    
    text = p.text.strip()
    if text.startswith('Chapter') or text.startswith('1 ') or text.startswith('2 ') or text.startswith('3 ') or text.startswith('4 ') or text.startswith('5 ') or text.startswith('6 ') or text in ['CERTIFICATE', 'Acknowledgement', 'ABSTRACT', 'Contents', 'LIST OF FIGURES', 'Literature Review', 'References']:
        print(f"Page {current_page} | P[{p_idx}]: {text}")

print(f"\nTotal Explicit Pages Found: {current_page}")
