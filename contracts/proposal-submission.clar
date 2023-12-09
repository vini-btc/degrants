;; title: proposal-submission
;; version: 0.0.1

(impl-trait .extension-trait.extension-trait)
(use-trait proposal-trait .proposal-trait.proposal-trait)

(define-constant ERR_UNAUTHORIZED (err u3000))
(define-constant ERR_UNKNOWN_PARAMETER (err u3001))

(define-map parameters (string-ascii 34) uint)

(map-set parameters "proposal-duration" u1440) ;; ~10 days based on a ~10 minute block time.

(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender .core) (contract-call? .core is-extension contract-caller)) ERR_UNAUTHORIZED))
)

(define-read-only (get-parameter (parameter (string-ascii 34)))
  (ok (unwrap! (map-get? parameters parameter) ERR_UNKNOWN_PARAMETER))
)

(define-public (propose (proposal <proposal-trait>) (title (string-ascii 50)) (description (string-utf8 500)))
  (begin
    (contract-call? .proposal-voting add-proposal
      proposal
      {
        end-block-height: (+ block-height (try! (get-parameter "proposal-duration"))),
        proposer: tx-sender,
        title: title,
        start-block-height: block-height,
        description: description
      }
    )
  )
)

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)