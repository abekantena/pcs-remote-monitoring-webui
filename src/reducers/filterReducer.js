import * as types from '../actions/actionTypes';
import {sortBy} from 'lodash';
import initialState from './initialState';

const filterReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.LOAD_DEVICE_GROUPS_SUCCESS:
      return {
        ...state,
        deviceGroups: sortBy(action.data, 'DisplayName')
      };

    case types.MANAGE_FILTERS_FLYOUT_DELETE_SUCCESS: {
      const deletedGroupId = action.data.id;
      const newDeviceGroup = state.deviceGroups.filter(group => group.Id !== deletedGroupId);
      return {
        ...state,
        deviceGroups: newDeviceGroup
      };
    }

    case types.MANAGE_FILTERS_FLYOUT_SAVE_SUCCESS: {
      const newDeviceGroup = [action.data].concat(state.deviceGroups);
      return {
        ...state,
        deviceGroups: sortBy(newDeviceGroup, 'DisplayName')
      };
    }

    case types.MANAGE_FILTERS_FLYOUT_UPDATE_SUCCESS: {
      const updatedGroupId = action.data.Id;
      let groupIdIdx = 0;
      state.deviceGroups.some((group, idx) => {
        if (group.Id === updatedGroupId) {
          groupIdIdx = idx;
          return true;
        }
        return false;
      });
      //First find out where the current updated device group is and create a
      //new array with the updated group added in the right order
      const newDeviceGroup = state.deviceGroups
        .slice(0, groupIdIdx)
        .concat([action.data])
        .concat(state.deviceGroups.slice(groupIdIdx + 1));

      return {
        ...state,
        deviceGroups: sortBy(newDeviceGroup, 'DisplayName')
      };
    }

    case types.DEVICE_GROUP_CHANGED:
      return {
        ...state,
        selectedGroupConditions: action.data.selectedGroupConditions,
        selectedDeviceGroupId: action.data.groupId
      };

    case types.LOAD_FIELDS_SUCCESS:
      return {
        ...state,
        deviceGroupFilters: action.data
      }

    default:
      return state;
  }
};
export default filterReducer;
