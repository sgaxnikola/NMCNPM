package vn.bluemoon.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import vn.bluemoon.backend.model.Account;
import vn.bluemoon.backend.repository.AccountRepository;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AccountRepository accountRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthController(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public record RegisterRequest(
            String username,
            String password,
            String fullName,
            String role
    ) {}

    public record AccountResponse(
            Long id,
            String username,
            String fullName,
            String role
    ) {}

    public record LoginRequest(
            String username,
            String password
    ) {}

    public record ChangePasswordRequest(
            String username,
            String currentPassword,
            String newPassword
    ) {}

    @GetMapping("/account")
    public ResponseEntity<?> getAccount(@RequestParam("username") String username) {
        if (username == null || username.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Thiếu username");
        }
        Optional<Account> accountOpt = accountRepository.findByUsername(username.trim());
        if (accountOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Tài khoản không tồn tại");
        }
        Account account = accountOpt.get();
        AccountResponse response = new AccountResponse(
                account.getId(),
                account.getUsername(),
                account.getFullName(),
                account.getRole()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.username() == null || request.username().isBlank()
                || request.password() == null || request.password().isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Username và password là bắt buộc");
        }

        if (accountRepository.existsByUsername(request.username())) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Username đã tồn tại");
        }

        Account account = new Account();
        account.setUsername(request.username().trim());
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setFullName(request.fullName());
        account.setRole(request.role() == null || request.role().isBlank() ? "USER" : request.role().trim());

        Account saved = accountRepository.save(account);

        AccountResponse response = new AccountResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getFullName(),
                saved.getRole()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.username() == null || request.username().isBlank()
                || request.password() == null || request.password().isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Username và password là bắt buộc");
        }

        Optional<Account> accountOpt = accountRepository.findByUsername(request.username().trim());
        if (accountOpt.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Sai username hoặc password");
        }

        Account account = accountOpt.get();
        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Sai username hoặc password");
        }

        AccountResponse response = new AccountResponse(
                account.getId(),
                account.getUsername(),
                account.getFullName(),
                account.getRole()
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        if (request.username() == null || request.username().isBlank()
                || request.currentPassword() == null || request.currentPassword().isBlank()
                || request.newPassword() == null || request.newPassword().isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Thiếu thông tin đổi mật khẩu");
        }

        Optional<Account> accountOpt = accountRepository.findByUsername(request.username().trim());
        if (accountOpt.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Tài khoản không tồn tại");
        }

        Account account = accountOpt.get();
        if (!passwordEncoder.matches(request.currentPassword(), account.getPasswordHash())) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Mật khẩu hiện tại không đúng");
        }

        if (request.currentPassword().equals(request.newPassword())) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        account.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        accountRepository.save(account);

        return ResponseEntity.ok("Đổi mật khẩu thành công");
    }
}

