package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.bluemoon.backend.model.Fee;

public interface FeeRepository extends JpaRepository<Fee, Long> {
}

