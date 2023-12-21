create table
  public.proposal (
    id bigint generated by default as identity,
    created_at timestamp with time zone not null default now(),
    title character varying null default ''::character varying,
    description character varying null default ''::character varying,
    milestones bigint null,
    fund - per - milestones numeric null,
    proposer character varying null default ''::character varying,
    passed boolean null,
    concluded boolean null,
    end - block - height numeric null,
    start - block - height numeric null,
    votes - for numeric null,
    votes - against numeric null,
    status text null,
    genesis - transaction text not null,
    contract - name text null,
    constraint proposal_pkey primary key (id, "genesis-transaction"),
    constraint proposal_genesis - transaction_key unique ("genesis-transaction"),
    constraint proposal_status_check check (
      (
        status = any (
          array[
            'mempool'::text,
            'aborted'::text,
            'confirmed'::text,
            'vote_started'::text,
            'accepted'::text,
            'rejected'::text,
            'funding'::text,
            'funded'::text
          ]
        )
      )
    )
  ) tablespace pg_default;