import os
import docx

def inspect_docx(file_path):
    print(f"=== INSPECTING DOCUMENT: {file_path} ===")
    if not os.path.exists(file_path):
        print(f"ERROR: File not found: {file_path}")
        return

    doc = docx.Document(file_path)

    # Section properties (Page margins, header, footer)
    for i, sec in enumerate(doc.sections):
        print(f"\n--- Section {i+1} ---")
        print(f"Page Width: {sec.page_width.inches:.2f} inches")
        print(f"Page Height: {sec.page_height.inches:.2f} inches")
        print(f"Top Margin: {sec.top_margin.inches:.2f} inches")
        print(f"Bottom Margin: {sec.bottom_margin.inches:.2f} inches")
        print(f"Left Margin: {sec.left_margin.inches:.2f} inches")
        print(f"Right Margin: {sec.right_margin.inches:.2f} inches")

    # Sample paragraph styles & formatting
    print("\n--- First 20 Paragraphs Styles & Formatting ---")
    for i, p in enumerate(doc.paragraphs[:25]):
        if not p.text.strip():
            continue
        style_name = p.style.name if p.style else "No Style"
        alignment = p.alignment
        font_name = p.runs[0].font.name if p.runs and p.runs[0].font else "Default"
        font_size = p.runs[0].font.size.pt if p.runs and p.runs[0].font and p.runs[0].font.size else "Default"
        bold = p.runs[0].font.bold if p.runs and p.runs[0].font else "Default"
        print(f"P[{i}] ({style_name}) | Text: '{p.text[:40]}...' | Font: {font_name}, {font_size}pt, Bold: {bold}, Align: {alignment}")

    # Inspect Styles
    print("\n--- Defined Document Styles ---")
    for s in doc.styles:
        if s.type == docx.enum.style.WD_STYLE_TYPE.PARAGRAPH:
            if hasattr(s, 'font') and s.font:
                fname = s.font.name
                fsize = s.font.size.pt if s.font.size else "N/A"
                print(f"Style: {s.name} | Font: {fname}, {fsize}pt")

if __name__ == '__main__':
    ref_path = os.path.join(os.path.dirname(__file__), '..', 'report', 'Project_Report-format.docx')
    target_path = os.path.join(os.path.dirname(__file__), '..', 'report', 'PennyWise_Project_Report_Complete.docx')
    inspect_docx(ref_path)
