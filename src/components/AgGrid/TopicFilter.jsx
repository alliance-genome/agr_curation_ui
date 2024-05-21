import { useGridFilter } from 'ag-grid-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';

export default ({ model, onModelChange }) => {
    const [closeFilter, setCloseFilter] = useState();
    const [unappliedModel, setUnappliedModel] = useState(model);
    const allTopics = useSelector(state => state.biblio.allTopics);
    const doesFilterPass = useCallback((params) => {
        // doesFilterPass only gets called if the filter is active
        return model.includes(params.data.topic_name);
    }, [model]);

    const afterGuiAttached = useCallback(({ hidePopup }) => {
        setCloseFilter(() => hidePopup);
    }, []);

    // register filter handlers with the grid
    useGridFilter({
        doesFilterPass,
        afterGuiAttached,
    });

    useEffect(() => {
        setUnappliedModel(model);
    }, [model]);

    const onTopicsChangeCheckbox = ({ target: { value, checked } }) => {
        let newModel = [];
        value = value === 'None' ? null : value;
        if (checked) {
            newModel = unappliedModel ? unappliedModel.concat([value]) : [value];
        } else {
            newModel = unappliedModel.filter(f => f !== value);
        }
        setUnappliedModel(newModel.length === 0 ? null : newModel);
    };

    const onTopicsChangeTypeAhead = (selectedOptions) => {
        const newModel = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setUnappliedModel(newModel.length === 0 ? null : newModel);
    };

    const onClick = () => {
        onModelChange(unappliedModel);
        if (closeFilter) {
            closeFilter();
        }
    };

    return (
        <div className="custom-filter">
            <div>Select Topic</div><hr/>
            {allTopics.length <= 10 ? (
                allTopics.map((topic) => {
                    let DisplayTopic = topic ? topic : 'None';
                    return (
                        <div key={topic}>
                            <input
                                type="checkbox"
                                id={topic}
                                value={DisplayTopic}
                                onChange={onTopicsChangeCheckbox}
                                checked={unappliedModel && unappliedModel.includes(DisplayTopic)}
                            />
                            <label htmlFor={topic}> {DisplayTopic}</label>
                        </div>
                    );
                })
            ) : (
                <Select
                    isMulti
                    options={allTopics.map(topic => ({ value: topic, label: topic }))}
                    onChange={onTopicsChangeTypeAhead}
                    value={unappliedModel ? unappliedModel.map(topic => ({ value: topic, label: topic })) : []}
                />
            )}
            <hr/><button onClick={onClick}>Apply</button>
        </div>
    );
};
