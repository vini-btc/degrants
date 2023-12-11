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