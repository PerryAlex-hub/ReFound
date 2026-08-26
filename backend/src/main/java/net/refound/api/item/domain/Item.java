package net.refound.api.item.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import net.refound.api.user.domain.User;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * A lost report or a found report.
 *
 * <p><strong>{@link #verificationAnswer} must never reach a student.</strong>
 * It is the private detail only the true owner would know, and the entire
 * anti-fraud design rests on it staying secret. Mappers are responsible for
 * excluding it from every DTO except the admin claim-review view.
 */
@Entity
@Table(name = "item")
@Getter
@Setter
@NoArgsConstructor
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemStatus status = ItemStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    // --- Location: a map pin, not an entry from a fixed list ---

    /** Null when the reporter could not place it. Always paired with longitude. */
    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;

    /** Optional place name, typed by the user or reverse-geocoded. */
    @Column(name = "location_label")
    private String locationLabel;

    /** Free text, e.g. "second floor, near the stairs". */
    @Column(name = "location_detail")
    private String locationDetail;

    /** When it was lost, or when it was found. */
    @Column(name = "occurred_on", nullable = false)
    private LocalDate occurredOn;

    /** Category-specific fields: colour, brand, model, serial. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> attributes = new HashMap<>();

    /**
     * FOUND items only, and mandatory there — enforced by a database check
     * constraint. Admin-visible only.
     */
    @Column(name = "verification_answer")
    private String verificationAnswer;

    /** False for high-value categories: a clear photo makes fraud trivial. */
    @Column(name = "photos_public", nullable = false)
    private boolean photosPublic = true;

    /** Set by an admin to remove an item from browse without deleting it. */
    @Column(nullable = false)
    private boolean hidden = false;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("position ASC")
    private List<ItemPhoto> photos = new ArrayList<>();

    // --- Convenience ---

    public boolean hasCoordinates() {
        return latitude != null && longitude != null;
    }

    public void addPhoto(ItemPhoto photo) {
        photo.setItem(this);
        photos.add(photo);
    }

    public void removePhoto(ItemPhoto photo) {
        photos.remove(photo);
        photo.setItem(null);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Item other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
