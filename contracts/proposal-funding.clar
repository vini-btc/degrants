;; title: proposal-funding
;; version: 0.0.1

(impl-trait .funding-trait.funding-trait)
(use-trait proposal-trait .proposal-trait.proposal-trait)

(define-constant ERR_UNAUTHORIZED (err u4000))
(define-constant ERR_PROPOSAL_FUND_ALREADY_STARTED (err u4001))
(define-constant ERR_MINIMUM_FUND_PER_MILESTONE (err u4002))
(define-constant ERR_PROPOSAL_ALREADY_FUNDED (err u4003))
(define-constant ERR_PROPOSAL_DOES_NOT_EXIST (err u4004))
(define-constant ERR_PROPOSAL_NOT_FUNDED (err u4005))
(define-constant ERR_PROPOSAL_NOT_CONCLUDED (err u4006))
(define-constant ERR_EXCEEDED_MILESTONES (err u4007))

(define-map proposals principal { milestones: uint, fund-per-milestone: uint, completed-milestones: uint, funded: bool })

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .core) (contract-call? .core is-extension contract-caller)) ERR_UNAUTHORIZED))
)

(define-public (start (proposal <proposal-trait>) (milestones uint) (fund-per-milestone uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (> milestones u0) ERR_MINIMUM_FUND_PER_MILESTONE)
    (asserts! (> fund-per-milestone u0) ERR_MINIMUM_FUND_PER_MILESTONE)
    (asserts! (try! (contract-call? .proposal-voting was-approved proposal)) ERR_PROPOSAL_NOT_CONCLUDED)
    (ok
      (asserts!
        (map-insert
          proposals (contract-of proposal)
          {
            milestones: milestones,
            fund-per-milestone: fund-per-milestone,
            completed-milestones: u0,
            funded: false
          })
        ERR_PROPOSAL_FUND_ALREADY_STARTED))))

(define-public (fund (proposal <proposal-trait>))
  (begin
    (let
      (
        (proposal-contract (map-get? proposals (contract-of proposal)))
        (amount (if (is-some proposal-contract) (* (default-to u0 (get fund-per-milestone proposal-contract)) (default-to u0 (get milestones proposal-contract))) u0)))
      (asserts! (is-some proposal-contract) ERR_PROPOSAL_DOES_NOT_EXIST)
      (asserts! (is-eq (get funded proposal-contract) (some false)) ERR_PROPOSAL_ALREADY_FUNDED)
      (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
      (map-set proposals (contract-of proposal) (merge (unwrap-panic proposal-contract) {funded: true}))
      (ok amount))))


(define-public (disburse (proposal <proposal-trait>) (number-of-milestones uint))
  (begin
    (let
      (
        (proposal-contract (map-get? proposals (contract-of proposal)))
        (completed-milestones (default-to u0 (get completed-milestones proposal-contract)))
        (total-milestones (default-to u0 (get milestones proposal-contract)))
        (amount-per-milestone (default-to u0 (get fund-per-milestone proposal-contract)))
      )
      (asserts! (>= (unwrap-panic (contract-call? .membership-token get-balance tx-sender)) u1) ERR_UNAUTHORIZED)
      (asserts! (is-some proposal-contract) ERR_PROPOSAL_DOES_NOT_EXIST)
      (asserts! (get funded (unwrap-panic proposal-contract)) ERR_PROPOSAL_NOT_FUNDED)
      (asserts! (<= (+ completed-milestones number-of-milestones) total-milestones) ERR_EXCEEDED_MILESTONES)
      (try! (stx-transfer? (* number-of-milestones amount-per-milestone) (as-contract tx-sender) tx-sender))
      (map-set proposals (contract-of proposal) (merge (unwrap-panic proposal-contract) {completed-milestones: (+ completed-milestones number-of-milestones)}))
      (ok number-of-milestones))))