package vn.bluemoon.backend.service;

import vn.bluemoon.backend.dto.search.SearchResultDto;

public interface SearchService {

    SearchResultDto search(String query);
}
