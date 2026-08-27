package net.refound.api.claim.domain;

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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import net.refound.api.item.domain.Item;
import net.refound.api.user.domain.User;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * One person asserting ownership of one found item.
 *
 * <p>Several people may claim the same item; an admin approves at most one.
 * A partial unique index allows only one live claim per person per item, while
 * still permitting an appeal after a rejection.
 *
 * <p>Approval is a single transaction: set APPROVED, move both items to
 * MATCHED, reject sibling claims, write the audit event, and enqueue the two
 * contact-release notifications. Any failure rolls all of it back.
 */
@Entity
@Table(name = "claim")
@Getter
@Setter
@NoArgsConstructor
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    /** The found item being claimed. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "found_item_id", nullable = false)
    private Item foundItem;

    /**
     * The claimant's own lost report, when they filed one. Nullable: many
     * people never report the loss and find the item while browsing.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lost_item_id")
    private Item lostItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claimant_id", nullable = false)
    private User claimant;

    /**
     * The claimant's account of distinguishing features. This is what an admin
     * compares against the finder's private verification answer.
     */
    @Column(nullable = false)
    private String description;

    /** When and where the claimant lost it. */
    @Column(name = "lost_context")
    private String lostContext;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClaimStatus status = ClaimStatus.PENDING;

    /** The question asked while the claim sits in AWAITING_INFO. */
    @Column(name = "info_request")
    private String infoRequest;

    /**
     * The claimant's answer to that question. Separate from {@link #description}
     * so the original statement of ownership survives for the reviewer.
     */
    @Column(name = "info_response")
    private String infoResponse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    /** Required on approve and reject. */
    @Column(name = "decision_reason")
    private String decisionReason;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "finder_confirmed_at")
    private Instant finderConfirmedAt;

    @Column(name = "claimant_confirmed_at")
    private Instant claimantConfirmedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ClaimEvidence> evidence = new ArrayList<>();

    // --- Convenience ---

    public boolean isOpen() {
        return status == ClaimStatus.PENDING || status == ClaimStatus.AWAITING_INFO;
    }

    /** The handover is complete only when both sides confirm it happened. */
    public boolean isHandoverConfirmed() {
        return finderConfirmedAt != null && claimantConfirmedAt != null;
    }

    public void addEvidence(ClaimEvidence item) {
        item.setClaim(this);
        evidence.add(item);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Claim other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
