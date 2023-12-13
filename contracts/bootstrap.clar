;; title: Degrants bootstrap
;; version: 0.0.1

(define-public (execute (sender principal))
    (begin
        (try! (contract-call? .core set-extension .proposal-submission true))
        (try! (contract-call? .core set-extension .proposal-voting true))
        (try! (contract-call? .core set-extension .membership-token true))
        (try! (contract-call? .membership-token mint u100 'ST1B4TR7KVSSXCKWNYX3VXNDHTK79ZDRGAJWWTA0G))
        (try! (contract-call? .membership-token mint u100 'ST3RDC4C9B0A2FG8B7DQ9MBTFPYQZNDAVC9AC7MAF))
        (ok true)))


