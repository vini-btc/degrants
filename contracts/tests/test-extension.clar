(impl-trait .extension-trait.extension-trait)
(use-trait extension-trait .extension-trait.extension-trait)
(use-trait proposal-trait .proposal-trait.proposal-trait)

(define-public (callback (sender principal) (memo (buff 34)))
    (begin 
     (print { event: "callback", memo: memo })
     (ok true)))

(define-public (disable) 
    (as-contract (contract-call? .core set-extension (as-contract tx-sender) false)))

(define-public (execute (proposal <proposal-trait>) (sender principal)) 
    (as-contract (contract-call? .core execute proposal sender)))

(define-public (request-callback (extension <extension-trait>) (memo (buff 34)))
    (as-contract (contract-call? .core request-extension-callback extension memo)))

;; Membership Token contract test helper functions

(define-public (call-membership-token-is-dao-or-extension-function)
    (as-contract (contract-call? .membership-token is-dao-or-extension)))

(define-public (call-membership-token-mint (amount uint) (recipient principal))
    (as-contract (contract-call? .membership-token mint amount recipient)))

(define-public (call-membership-token-burn (amount uint) (recipient principal))
    (as-contract (contract-call? .membership-token burn amount recipient)))

(define-public (call-proposal-submission-propose-function (proposal <proposal-trait>) (title (string-ascii 50)) (description (string-utf8 500)))
    (as-contract (contract-call? .proposal-submission propose proposal title description)))