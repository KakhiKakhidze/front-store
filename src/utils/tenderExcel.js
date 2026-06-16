import * as XLSX from "xlsx";

const fmtMoney = (n) => Number(n || 0).toFixed(2);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("ka-GE") : "—");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("ka-GE") : "—");

const setColWidths = (ws, widths) => {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
};

const mergeCells = (ws, ranges) => {
  ws["!merges"] = (ws["!merges"] || []).concat(ranges);
};

const addStyledRow = (rows, ...cells) => rows.push(cells);

export function exportWinnerDeclaration(tender) {
  const winnerBid = tender.bids.find(
    (b) => String(b.supplier_id) === String(tender.winner_supplier?._id || tender.winner_supplier)
  ) || tender.bids.find((b) => b.supplier_name === tender.winner_name);

  const rows = [];

  addStyledRow(rows, "გამარჯვებულის გამოცხადების აქტი");
  addStyledRow(rows, "WINNER DECLARATION CERTIFICATE");
  addStyledRow(rows, "");
  addStyledRow(rows, "ტენდერის ნომერი:", tender.tender_number);
  addStyledRow(rows, "სათაური:", tender.title);
  addStyledRow(rows, "აღწერა:", tender.description || "—");
  addStyledRow(rows, "სტატუსი:", tender.status);
  addStyledRow(rows, "გამოცხადების თარიღი:", fmtDateTime(tender.date_awarded));
  addStyledRow(rows, "ბოლო ვადა:", fmtDateTime(tender.deadline));
  addStyledRow(rows, "შემქმნელი:", tender.creator_name || "—");
  addStyledRow(rows, "ფინ. დამტკიცება:", tender.finance_approver_name || "—");
  addStyledRow(rows, "გამომცხადებელი:", tender.awarder_name || "—");
  addStyledRow(rows, "");
  addStyledRow(rows, "გამარჯვებული მომწოდებელი / WINNING SUPPLIER");
  addStyledRow(rows, "სახელი:", tender.winner_name || "—");
  if (winnerBid) {
    addStyledRow(rows, "შეთავაზების თარიღი:", fmtDateTime(winnerBid.submitted_at));
    addStyledRow(rows, "დღგ-ს სტატუსი:", winnerBid.has_vat ? "დღგ-თი" : "დღგ-ს გარეშე");
    addStyledRow(rows, "შენიშვნები:", winnerBid.notes || "—");
  }
  addStyledRow(rows, "");
  addStyledRow(rows, "მიღებული შეთავაზებების რაოდენობა:", tender.bids?.length || 0);
  addStyledRow(rows, "");

  addStyledRow(rows, "მიწოდებული ნივთები / AWARDED ITEMS");
  addStyledRow(rows, "#", "კოდი", "დასახელება", "ერთეული", "რაოდენობა", "ერთ. ფასი", "ჯამი");

  let grandTotal = 0;
  if (winnerBid) {
    winnerBid.lines.forEach((line, idx) => {
      const tenderItem = tender.items.find(
        (it) => String(it.id) === String(line.tender_item_id)
      );
      const lineTotal = Number(line.unit_price) * Number(line.qty_offered);
      grandTotal += lineTotal;
      addStyledRow(
        rows,
        idx + 1,
        tenderItem?.item_code || line.item_code || "",
        tenderItem?.item_name || line.item_name || "",
        tenderItem?.unit_of_measure || line.unit_of_measure || "",
        Number(line.qty_offered),
        Number(line.unit_price),
        lineTotal
      );
    });
  }
  addStyledRow(rows, "", "", "", "", "", "სულ ჯამი:", grandTotal);
  addStyledRow(rows, "");
  addStyledRow(rows, "");
  addStyledRow(rows, "ხელმოწერები / SIGNATURES");
  addStyledRow(rows, "");
  addStyledRow(rows, "შემქმნელი:", "_______________________", "", "თარიღი:", "_______________________");
  addStyledRow(rows, "");
  addStyledRow(rows, "ფინ. დამტკიცება:", "_______________________", "", "თარიღი:", "_______________________");
  addStyledRow(rows, "");
  addStyledRow(rows, "გენ. მენეჯერი:", "_______________________", "", "თარიღი:", "_______________________");
  addStyledRow(rows, "");
  addStyledRow(rows, "მომწოდებელი:", "_______________________", "", "თარიღი:", "_______________________");

  const ws = XLSX.utils.aoa_to_sheet(rows);
  setColWidths(ws, [22, 22, 30, 12, 14, 14, 16]);

  // Merge title rows across columns
  mergeCells(ws, [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
  ]);

  // Style title cells (best-effort — community xlsx ignores complex styles, but bold/align is fine)
  const titleStyle = { font: { bold: true, sz: 16 }, alignment: { horizontal: "center" } };
  if (ws["A1"]) ws["A1"].s = titleStyle;
  if (ws["A2"]) ws["A2"].s = { ...titleStyle, font: { bold: true, sz: 12 } };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Winner Declaration");
  XLSX.writeFile(wb, `Winner-Declaration-${tender.tender_number}.xlsx`);
}

export function exportBidComparison(tender) {
  const rows = [];

  addStyledRow(rows, "შეთავაზებების შედარება / BID COMPARISON");
  addStyledRow(rows, "");
  addStyledRow(rows, "ტენდერის ნომერი:", tender.tender_number, "", "სტატუსი:", tender.status);
  addStyledRow(rows, "სათაური:", tender.title);
  addStyledRow(rows, "აღწერა:", tender.description || "—");
  addStyledRow(rows, "შემქმნელი:", tender.creator_name || "—", "", "ბოლო ვადა:", fmtDateTime(tender.deadline));
  addStyledRow(rows, "ფინ. დამტკიცება:", tender.finance_approver_name || "—", "", "გამოცხადება:", fmtDateTime(tender.date_awarded));
  addStyledRow(rows, "გამარჯვებული:", tender.winner_name || "—");
  addStyledRow(rows, "ანგარიშის გენერაცია:", fmtDateTime(new Date()));
  addStyledRow(rows, "");

  const sortedBids = [...(tender.bids || [])].sort((a, b) => a.total_amount - b.total_amount);

  if (sortedBids.length === 0) {
    addStyledRow(rows, "შეთავაზებები არ არის / No bids submitted");
  } else {
    const lowestTotal = sortedBids[0].total_amount;
    const highestTotal = sortedBids[sortedBids.length - 1].total_amount;
    const avgTotal = sortedBids.reduce((s, b) => s + b.total_amount, 0) / sortedBids.length;
    const savingsAbs = highestTotal - lowestTotal;
    const savingsPct = highestTotal > 0 ? (savingsAbs / highestTotal) * 100 : 0;

    addStyledRow(rows, "სტატისტიკა / STATISTICS");
    addStyledRow(rows, "მიღებული შეთავაზებები:", sortedBids.length);
    addStyledRow(rows, "ყველაზე დაბალი:", Number(lowestTotal.toFixed(2)));
    addStyledRow(rows, "ყველაზე მაღალი:", Number(highestTotal.toFixed(2)));
    addStyledRow(rows, "საშუალო:", Number(avgTotal.toFixed(2)));
    addStyledRow(rows, "შესაძლო დანაზოგი (max−min):", Number(savingsAbs.toFixed(2)), "", "% მაქს.-დან:", `${savingsPct.toFixed(1)}%`);
    addStyledRow(rows, "");

    // Comparison header — three rows
    const rankRow = ["", "", "", "ადგილი:"];
    const supplierRow = ["", "", "", "მომწოდებელი:"];
    const subHeaderRow = ["კოდი", "დასახელება", "ერთეული", "საჭ. რაოდ."];
    sortedBids.forEach((b, idx) => {
      const rankLabel = idx === 0 ? `${idx + 1} ★` : `${idx + 1}`;
      rankRow.push(rankLabel, "", "");
      supplierRow.push(b.supplier_name, "", "");
      subHeaderRow.push("ფასი", "რაოდ.", "ჯამი");
    });
    addStyledRow(rows, ...rankRow);
    addStyledRow(rows, ...supplierRow);
    addStyledRow(rows, ...subHeaderRow);

    tender.items.forEach((it) => {
      // Per-line cheapest unit price
      const linePrices = sortedBids
        .map((b) => b.lines.find((l) => String(l.tender_item_id) === String(it.id))?.unit_price)
        .filter((p) => p !== undefined && p !== null);
      const minLinePrice = linePrices.length ? Math.min(...linePrices) : null;

      const row = [it.item_code, it.item_name, it.unit_of_measure, Number(it.qty_required)];
      sortedBids.forEach((b) => {
        const line = b.lines.find((l) => String(l.tender_item_id) === String(it.id));
        if (line) {
          const lineTotal = Number(line.unit_price) * Number(line.qty_offered);
          const isLineWinner = minLinePrice !== null && Number(line.unit_price) === minLinePrice;
          row.push(
            isLineWinner ? `${Number(line.unit_price)} ★` : Number(line.unit_price),
            Number(line.qty_offered),
            lineTotal
          );
        } else {
          row.push("—", "—", "—");
        }
      });
      addStyledRow(rows, ...row);
    });

    // Totals row
    const totalRow = ["", "", "", "სულ ჯამი:"];
    sortedBids.forEach((b, idx) => {
      const label = idx === 0 ? `${Number(b.total_amount)} ★` : Number(b.total_amount);
      totalRow.push("", "", label);
    });
    addStyledRow(rows, ...totalRow);

    // VAT Status row
    const vatRow = ["", "", "", "დღგ-ს სტატუსი:"];
    sortedBids.forEach((b) => {
      vatRow.push("", "", b.has_vat ? "დღგ-თი" : "დღგ-ს გარეშე");
    });
    addStyledRow(rows, ...vatRow);

    // Variance from lowest
    const varianceRow = ["", "", "", "% დაბლიდან:"];
    sortedBids.forEach((b) => {
      const variance = lowestTotal > 0 ? ((b.total_amount - lowestTotal) / lowestTotal) * 100 : 0;
      varianceRow.push("", "", `+${variance.toFixed(1)}%`);
    });
    addStyledRow(rows, ...varianceRow);

    // Savings vs each bid (how much would we save vs this bid)
    const savingsRow = ["", "", "", "დანაზოგი winner-ის სასარგ.:"];
    sortedBids.forEach((b) => {
      const saved = b.total_amount - lowestTotal;
      savingsRow.push("", "", saved === 0 ? "—" : Number(saved.toFixed(2)));
    });
    addStyledRow(rows, ...savingsRow);

    // Per-line winner count per supplier
    const lineWinsRow = ["", "", "", "მოგებული პოზიციები:"];
    const lineWinCounts = sortedBids.map(() => 0);
    tender.items.forEach((it) => {
      const linePrices = sortedBids
        .map((b) => b.lines.find((l) => String(l.tender_item_id) === String(it.id))?.unit_price)
        .filter((p) => p !== undefined && p !== null);
      if (!linePrices.length) return;
      const minLinePrice = Math.min(...linePrices);
      sortedBids.forEach((b, idx) => {
        const line = b.lines.find((l) => String(l.tender_item_id) === String(it.id));
        if (line && Number(line.unit_price) === minLinePrice) lineWinCounts[idx] += 1;
      });
    });
    sortedBids.forEach((b, idx) => {
      lineWinsRow.push("", "", `${lineWinCounts[idx]} / ${tender.items.length}`);
    });
    addStyledRow(rows, ...lineWinsRow);

    addStyledRow(rows, "");
    addStyledRow(rows, "შეთავაზებების რანჟირება / RANKING");
    addStyledRow(rows, "ადგილი", "მომწოდებელი", "დღგ-ს სტატუსი", "ჯამური თანხა", "% დაბლიდან", "შეტანის თარიღი", "მოგებული პოზიციები", "შენიშვნა");
    sortedBids.forEach((b, idx) => {
      const variance = lowestTotal > 0 ? ((b.total_amount - lowestTotal) / lowestTotal) * 100 : 0;
      addStyledRow(
        rows,
        idx + 1,
        b.supplier_name,
        b.has_vat ? "დღგ-თი" : "დღგ-ს გარეშე",
        Number(b.total_amount),
        idx === 0 ? "—" : `+${variance.toFixed(1)}%`,
        fmtDateTime(b.submitted_at),
        `${lineWinCounts[idx]} / ${tender.items.length}`,
        idx === 0 ? "★ ყველაზე იაფი" : ""
      );
    });

    // Supplier notes
    const bidsWithNotes = sortedBids.filter((b) => (b.notes || "").trim());
    if (bidsWithNotes.length > 0) {
      addStyledRow(rows, "");
      addStyledRow(rows, "მომწოდებლების შენიშვნები / SUPPLIER NOTES");
      addStyledRow(rows, "მომწოდებელი", "შენიშვნა");
      bidsWithNotes.forEach((b) => {
        addStyledRow(rows, b.supplier_name, b.notes);
      });
    }

    // Per-line bid notes
    const lineNotes = [];
    sortedBids.forEach((b) => {
      b.lines.forEach((l) => {
        if ((l.notes || "").trim()) {
          const it = tender.items.find((x) => String(x.id) === String(l.tender_item_id));
          lineNotes.push({ supplier: b.supplier_name, item: it ? `${it.item_code} — ${it.item_name}` : "—", note: l.notes });
        }
      });
    });
    if (lineNotes.length > 0) {
      addStyledRow(rows, "");
      addStyledRow(rows, "ხაზობრივი შენიშვნები / LINE-LEVEL NOTES");
      addStyledRow(rows, "მომწოდებელი", "ნივთი", "შენიშვნა");
      lineNotes.forEach((ln) => addStyledRow(rows, ln.supplier, ln.item, ln.note));
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const widths = [14, 28, 10, 26];
  for (let i = 0; i < sortedBids.length; i++) widths.push(14, 12, 14);
  setColWidths(ws, widths);

  mergeCells(ws, [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(6, widths.length - 1) } }]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bid Comparison");
  XLSX.writeFile(wb, `Bid-Comparison-${tender.tender_number}.xlsx`);
}

export function exportTenderItemsList(tender) {
  const rows = [];
  addStyledRow(rows, "სატენდერო ნივთების სია / TENDER ITEMS LIST");
  addStyledRow(rows, "");
  addStyledRow(rows, "ტენდერი:", tender.tender_number, "", "სათაური:", tender.title);
  addStyledRow(rows, "ბოლო ვადა:", fmtDateTime(tender.deadline));
  addStyledRow(rows, "");
  addStyledRow(rows, "#", "კოდი", "დასახელება", "ერთეული", "საჭ. რაოდენობა", "თქვენი ერთ. ფასი", "ჯამი", "შენიშვნა");
  tender.items.forEach((it, idx) => {
    addStyledRow(
      rows,
      idx + 1,
      it.item_code,
      it.item_name,
      it.unit_of_measure,
      Number(it.qty_required),
      "",
      "",
      it.notes || ""
    );
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  setColWidths(ws, [5, 14, 30, 12, 14, 16, 14, 24]);
  mergeCells(ws, [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tender Items");
  XLSX.writeFile(wb, `Tender-Items-${tender.tender_number}.xlsx`);
}
