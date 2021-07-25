import { Subscribable, distinctUntilChanged, map, Subscription, BehaviorSubject, Observable } from 'rxjs';

class Action<TState> {
    name: string;
    call: (state: TState, ...args: any[]) => any;
}

class ChildSubscription {
    property: string;
    subscription: Subscription;
}

export class StateManager<TState> implements Subscribable<TState> {

    private state$: BehaviorSubject<TState>;

    private childrenSubscriptions: ChildSubscription[];
    private actions: Action<TState>[];

    public get subscribe() { return this.state$.subscribe.bind(this.state$); }
    public get value(): TState { return this.state$.getValue(); }

    public constructor(private initialValue: TState) {
        this.state$ = new BehaviorSubject<TState>(initialValue);
        this.childrenSubscriptions = [];
        this.actions = [];
    }

    public set(value: TState): void {
        this.state$.next(value);
    }

    public reset(): void {
        this.state$.next(this.initialValue);
    }

    public update<TPartial>(partialValue: TPartial): void {
        this.state$.next({ ...this.value, ...partialValue });
    }

    public getPropertyObservable<TProperty>(key: string): Observable<TProperty> {
        return this.state$.pipe(map((state: TState) => state[key]), distinctUntilChanged<TProperty>());
    }

    public call(name: string, ...inputs: any[]): void {
        const action = this.actions.find((action: Action<TState>) => action.name === name);
        if (!action) return;

        this.update(action.call(this.value, ...inputs));
    }

    public createAction<TPartial>(name: string, action: (state: TState, ...inputs: any[]) => TPartial): void {
        this.actions = [ ...this.actions, { name, call: action } ];
    }

    public removeAction(name: string): void {
        this.actions = this.actions
        .filter((action: Action<TState>) => action.name !== name);
    }

    public createChild<TChild>(key: string): StateManager<TChild> {
        const child = new StateManager<TChild>(this.value[key]);
       
        // update this on child updated
        const childSubscription = child.subscribe((value: TChild) => {
            if (value === this.value[key]) return;
            this.update({ [key]: value })
        });
        this.childrenSubscriptions = [ ...this.childrenSubscriptions, { property: key, subscription: childSubscription } ];

        // update child on this updated
        const propertySubscription = this.getPropertyObservable(key).subscribe(child.set.bind(child));
        this.childrenSubscriptions = [ ...this.childrenSubscriptions, { property: key, subscription: propertySubscription } ];

        return child;
    }

    public removeChild(key: string): void {
        this.childrenSubscriptions
        .filter(({ property }: { property: string }) => property === key)
        .forEach(({ subscription }: { subscription: Subscription }) => subscription.unsubscribe());

        this.childrenSubscriptions = this.childrenSubscriptions
        .filter(({ property }: { property: string }) => property !== key)
    }

    public removeAllChildren(): void {
        this.childrenSubscriptions
        .forEach(({ subscription }: { subscription: Subscription }) => subscription.unsubscribe());

        this.childrenSubscriptions = [];
    }
}