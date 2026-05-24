package vn.bluemoon.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.bluemoon.backend.dto.report.ReportSummaryDto;
import vn.bluemoon.backend.service.ReportService;

/**
 * Báo cáo / thống kê (tương đương ReportController trong đặc tả bài tập IT3180).
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    public ReportSummaryDto summary() {
        return reportService.getSummary();
    }
}
