(impl-trait .proposal-trait.proposal-trait)

(define-constant err-already-executed (err u1))
(define-constant title "aslkdjgfsfdkj")
(define-constant description "aslkdjgfsfdkj")
(define-constant milestones u1)
(define-constant fund-per-milestone u1000)

(define-data-var status bool false)

(define-public (execute (sender principal))
    (begin
        (asserts! (not (var-get status)) err-already-executed)
        (var-set status true)
        (ok true)))

(define-read-only (get-status) (var-get status))

(define-read-only (get-proposal-data)
    (ok { milestones: milestones, title: title, description: description, fund-per-milestone: fund-per-milestone }))