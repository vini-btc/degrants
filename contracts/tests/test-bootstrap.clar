(impl-trait .proposal-trait.proposal-trait)

(define-public (execute (sender principal))
    (begin
        (try! (contract-call? .core set-extension .test-extension true))
        (try! (contract-call? .core set-extension .proposal-submission true))
        (try! (contract-call? .core set-extension .proposal-voting true))
        (try! (contract-call? .core set-extension .proposal-funding true))
        (try! (contract-call? .membership-token mint u1000 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
        (try! (contract-call? .membership-token mint u1000 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))
        (try! (contract-call? .membership-token mint u1000 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC))
        (ok true)))

