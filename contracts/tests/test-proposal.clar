(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
    (begin
        (print "proposal-executed")
        (ok true)))
