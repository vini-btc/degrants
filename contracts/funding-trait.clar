;; title: funding-trait
;; version: 0.0.1
(use-trait proposal-trait .proposal-trait.proposal-trait)

(define-trait funding-trait
    (
        (start (<proposal-trait> uint uint) (response bool uint))
        (fund (<proposal-trait>) (response uint uint))
        (disburse (<proposal-trait> uint) (response uint uint))
    )
)
