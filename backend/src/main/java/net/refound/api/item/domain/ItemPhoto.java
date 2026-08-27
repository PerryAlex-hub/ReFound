package net.refound.api.item.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * A photo attached to an item. The binary lives in object storage; only the URL
 * is stored here.
 *
 * <p>Visibility is decided by {@link Item#isPhotosPublic()}, not per photo.
 */
@Entity
@Table(name = "item_photo")
@Getter
@Setter
@NoArgsConstructor
public class ItemPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false)
    private String url;

    /**
     * The storage provider's identifier for this file.
     *
     * <p>The URL displays an image; only this can delete one. Without it,
     * removing a photo would leave the file in the Cloudinary account forever.
     */
    @Column(name = "public_id", nullable = false)
    private String publicId;

    /** Display order, 0-4. The database caps an item at five photos. */
    @Column(nullable = false)
    private int position = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ItemPhoto other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
