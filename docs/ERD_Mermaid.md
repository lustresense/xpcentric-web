# ERD Visual & Data Dictionary SIMREKAP

Dokumen ini berisi diagram Entity-Relationship (ERD) visual lengkap berbasis **Mermaid.js** yang diekstrak langsung dari skema database resmi `database/schema/simrekap_schema.sql`.

---

## 1. Diagram Visual ERD (Mermaid)

```mermaid
erDiagram
    users {
        TEXT id PK
        TEXT name
        TEXT email UK
        TEXT password_hash
        TEXT nik
        TEXT rw
        TEXT role_code
        INTEGER is_ksh
        INTEGER moderator_tier
        TEXT tier2_badge
        INTEGER email_verified
        TEXT phone_number
        INTEGER phone_verified
        INTEGER kelurahan_id FK
        INTEGER kecamatan_id FK
        INTEGER points
        TEXT badges_json
        TEXT created_at
        TEXT updated_at
    }

    roles {
        INTEGER id PK
        TEXT code UK
        TEXT name
    }

    role_attributes {
        INTEGER id PK
        INTEGER role_id FK
        TEXT attribute_key
        TEXT attribute_value
    }

    kecamatan {
        INTEGER id PK
        TEXT code UK
        TEXT name UK
    }

    kelurahan {
        INTEGER id PK
        TEXT code UK
        INTEGER kecamatan_id FK
        TEXT name
    }

    postal_codes {
        INTEGER id PK
        TEXT code UK
    }

    kampung_mapping {
        INTEGER id PK
        INTEGER kelurahan_id FK
        INTEGER postal_code_id FK
    }

    access_requests {
        TEXT id PK
        TEXT requester_user_id FK
        TEXT requester_email
        TEXT requester_name
        TEXT current_role
        TEXT requested_role
        TEXT requested_scope_type
        INTEGER requested_kelurahan_id FK
        INTEGER requested_kecamatan_id FK
        TEXT position_or_title
        TEXT reason
        TEXT status
        TEXT reviewed_by_user_id FK
        TEXT review_note
        TEXT created_at
        TEXT reviewed_at
    }

    events {
        TEXT id PK
        TEXT title
        TEXT description
        INTEGER pillar
        TEXT event_date
        TEXT event_time
        TEXT location
        INTEGER quota
        TEXT scope_type
        INTEGER kecamatan_id FK
        INTEGER kelurahan_id FK
        TEXT created_by_user_id FK
        TEXT status
        TEXT output_summary
        TEXT published_at
        TEXT completed_at
        TEXT completed_by_user_id
        TEXT created_at
        TEXT updated_at
    }

    event_participation {
        INTEGER id PK
        TEXT event_id FK
        TEXT user_id FK
        TEXT status
        INTEGER checklist_done
        TEXT created_at
        TEXT updated_at
    }

    event_reports {
        TEXT id PK
        TEXT event_id FK
        TEXT user_id FK
        INTEGER participants
        TEXT checklist_json
        TEXT outcome_tags_json
        TEXT photo_url
        TEXT status
        INTEGER points_awarded
        TEXT verified_by_user_id
        TEXT verified_at
        TEXT reject_reason
        TEXT created_at
        TEXT updated_at
    }

    certificates {
        TEXT id PK
        TEXT user_id FK
        TEXT event_id FK
        TEXT report_id FK
        TEXT certificate_hash
        TEXT issued_at
    }

    xp_kelurahan {
        INTEGER kelurahan_id PK, FK
        INTEGER total_xp
        TEXT updated_at
    }

    xp_pillar {
        INTEGER id PK
        INTEGER kelurahan_id FK
        INTEGER pillar
        INTEGER xp
        TEXT updated_at
    }

    voucher_catalog {
        TEXT id PK
        TEXT name
        TEXT description
        INTEGER xp_cost
        INTEGER stock
        INTEGER is_active
        TEXT created_at
    }

    voucher_redemptions {
        TEXT id PK
        TEXT user_id FK
        TEXT voucher_id FK
        INTEGER xp_spent
        TEXT voucher_code
        TEXT redeemed_at
        TEXT expires_at
    }

    collaboration_requests {
        TEXT id PK
        TEXT organization_name
        TEXT pic_name
        TEXT email
        TEXT support_type
        TEXT contribution_scope
        INTEGER scope_kecamatan_id FK
        INTEGER scope_kelurahan_id FK
        TEXT support_description
        TEXT submitted_by_user_id FK
        TEXT status
        TEXT reviewed_by_user_id FK
        TEXT reviewed_at
        TEXT created_at
        TEXT updated_at
    }

    notifications {
        INTEGER id PK
        TEXT user_id FK
        TEXT type
        TEXT title
        TEXT message
        INTEGER is_read
        TEXT entity_type
        TEXT entity_id
        TEXT created_at
    }

    sessions {
        TEXT token PK
        TEXT user_id FK
        TEXT expires_at
        TEXT created_at
    }

    audit_logs {
        INTEGER id PK
        TEXT actor_user_id
        TEXT action
        TEXT entity_type
        TEXT entity_id
        TEXT payload_json
        TEXT created_at
    }

    otp_challenges {
        TEXT id PK
        TEXT phone_number
        TEXT purpose
        TEXT otp_hash
        TEXT expires_at
        TEXT consumed_at
        INTEGER attempts
        INTEGER max_attempts
        TEXT created_at
    }

    temporary_adjustments {
        TEXT id PK
        TEXT user_id FK
        TEXT adjustment_type
        TEXT value_json
        TEXT reason
        TEXT expires_at
        TEXT created_at
    }

    %% Relationships
    kecamatan ||--o{ kelurahan : contains
    kelurahan ||--o{ kampung_mapping : maps
    postal_codes ||--o{ kampung_mapping : maps
    kelurahan ||--o{ users : located_in
    kecamatan ||--o{ users : located_in
    roles ||--o{ role_attributes : has
    users ||--o{ access_requests : requests
    users ||--o{ events : creates
    events ||--o{ event_participation : has
    users ||--o{ event_participation : joins
    events ||--o{ event_reports : reported
    users ||--o{ event_reports : submits
    users ||--o{ certificates : receives
    events ||--o{ certificates : certifies
    event_reports ||--o{ certificates : verifies
    kelurahan ||--o{ xp_kelurahan : tracks
    kelurahan ||--o{ xp_pillar : tracks
    users ||--o{ voucher_redemptions : redeems
    voucher_catalog ||--o{ voucher_redemptions : redeemed_as
    users ||--o{ collaboration_requests : submits
    users ||--o{ notifications : receives
    users ||--o{ sessions : owns
    users ||--o{ temporary_adjustments : adjusts
```

---

## 2. Indeks & Unique Constraints Penting

- `access_requests`: Unique Index `idx_access_requests_pending_role` pada `(requester_user_id, requested_role)` WHERE status = 'pending'.
- `event_participation`: Unique Constraint `UNIQUE(event_id, user_id)` (mencegah duplicate join).
- `certificates`: Unique Constraint `UNIQUE(user_id, event_id)` (satu sertifikat per event per user).
- `xp_pillar`: Unique Constraint `UNIQUE(kelurahan_id, pillar)`.
- `kampung_mapping`: Unique Constraint `UNIQUE(kelurahan_id, postal_code_id)`.
