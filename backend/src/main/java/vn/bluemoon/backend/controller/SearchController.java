package vn.bluemoon.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.bluemoon.backend.dto.search.SearchResultDto;
import vn.bluemoon.backend.service.SearchService;

/**
 * Tìm kiếm tổng hợp (tương đương SearchController trong đặc tả bài tập IT3180).
 */
@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public ResponseEntity<?> search(@RequestParam(name = "q", required = false) String q) {
        if (q == null || q.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Thiếu từ khóa tìm kiếm (q)");
        }
        return ResponseEntity.ok(searchService.search(q));
    }
}
