# Builds scripts/converter-tests/fixtures/edge-cases.xlsx (29/09): dates with
# and without time, text with leading zeros, percentages, thousands format,
# an empty cell, a formula, Unicode + emoji, commas and quotes in text.
# Run: python scripts/converter-tests/fixtures/make-excel-fixture.py
import datetime, os, openpyxl

wb = openpyxl.Workbook()
ws = wb.active
ws.title = 'Data'
ws.append(['id', 'name', 'date', 'zip', 'pct', 'price', 'note', 'f'])
ws.append([1, 'Ann', datetime.date(2024, 1, 15), '01234', 0.125, 1234.5, None, '=F2*2'])
ws.append([2, 'Zoé \U0001F600', datetime.datetime(2024, 2, 29, 13, 45), '00012', 1, 0.1, 'x, "y"', None])
ws['E2'].number_format = '0.00%'
ws['E3'].number_format = '0.00%'
ws['F2'].number_format = '#,##0.00'
ws['C2'].number_format = 'yyyy-mm-dd'
ws['C3'].number_format = 'yyyy-mm-dd hh:mm'
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'edge-cases.xlsx')
wb.save(out)
print(out)
