package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.bluemoon.backend.model.Fee;

import java.util.List;

public interface FeeRepository extends JpaRepository<Fee, Long> {
    List<Fee> findByNameContainingIgnoreCase(String name);

    List<Fee> findByFrequencyIgnoreCase(String frequency);
}

