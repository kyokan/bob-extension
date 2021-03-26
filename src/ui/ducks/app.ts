type Action = {
  type: string;
  payload?: any;
  error?: boolean;
  meta?: any;
};

type State = {

};

const initialState: State = {

};

export default function app(state = initialState, action: Action): State {
  switch (action.type) {
    default:
      return state;
  }
}
