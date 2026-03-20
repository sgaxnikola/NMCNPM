package vn.bluemoon.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.bluemoon.backend.model.Account;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByUsername(String username);

    boolean existsByUsername(String username);
}

