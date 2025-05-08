n_task(1..K) :- K = #count{1,T :task(T)}.

1{ order(T,N) : n_task(N) }1 :- task(T).

:-  order(T1,N1),
    order(T2,N2),
    T1!=T2,
    N1 < N2,
    task_r(T1,R),
    task_p(T2,R),
    N1>0,
    N2>0.

:-  order(T1,N),
    order(T2,N),
    T1!=T2,
    N>0.

#show.
#show order(T,N) : order(T,N), N >0.
