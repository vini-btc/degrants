(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
    (begin
        (try! (contract-call? .core set-extension .test-extension true))
        (try! (contract-call? .core set-extension .proposal-submission true))
        (try! (contract-call? .core set-extension .proposal-voting true))
        (ok true)))
