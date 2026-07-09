import type { InteractionModel } from '../types';

interface PrototypeControlsProps {
  model: InteractionModel;
  onModelChange: (model: InteractionModel) => void;
  onReset: () => void;
}

export function PrototypeControls({
  model,
  onModelChange,
  onReset,
}: PrototypeControlsProps) {
  return (
    <div className="prototype-controls">
      <span className="prototype-controls__label">Prototype</span>
      <div className="prototype-controls__tabs">
        <button
          className={`prototype-controls__tab ${model === 'model1' ? 'prototype-controls__tab--active' : ''}`}
          onClick={() => onModelChange('model1')}
        >
          Model 1
        </button>
        <button
          className={`prototype-controls__tab ${model === 'model2' ? 'prototype-controls__tab--active' : ''}`}
          onClick={() => onModelChange('model2')}
        >
          Model 2
        </button>
        <button
          className={`prototype-controls__tab ${model === 'model3' ? 'prototype-controls__tab--active' : ''}`}
          onClick={() => onModelChange('model3')}
        >
          Model 3
        </button>
      </div>
      <button className="prototype-controls__reset" onClick={onReset}>
        Reset data
      </button>
    </div>
  );
}
