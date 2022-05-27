// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "./utils/MetaPtr.sol";
import "./utils/OwnerList.sol";

/**
 * @title ProjectRegistry
 * @notice todo
 * @dev todo
 */
contract ProjectRegistry {
    // Types
    // The project structs contains the minimal data we need for a project
    struct Project {
        uint96 id;
        address recipient;
        MetaPtr metadata;
    }

    // State variables

    // Used as sentinel value in the owners linked list.
    address OWNERS_LIST_SENTINEL = address(0x1);

    // The number of projects created, used to give an incremental id to each one
    uint96 public projectsCount;

    // The mapping of projects, from projectID to Project
    mapping(uint96 => Project) public projects;

    // The mapping projects owners, from projectID to OwnerList
    mapping(uint96 => OwnerList) public projectsOwners;

    // Events

    event ProjectCreated(address indexed owner, uint96 projectID);
    event MetaDataUpdated(address indexed owner, uint96 projectID);

    // Modifiers

    modifier onlyProjectOwner(uint96 projectID) {
        require(projectsOwners[projectID].list[msg.sender] != address(0), "not owner");
        _;
    }

    constructor() {}

    // External functions

    /**
     * @notice todo
     * @dev todo
     */
    function createProject(address recipient, MetaPtr memory metadata) external {
        uint96 projectID = projectsCount++;

        Project storage g = projects[projectID];
        g.id = projectID;
        g.recipient = recipient;
        g.metadata = metadata;

        initProjectOwners(projectID);

        emit ProjectCreated(msg.sender, projectID);
    }

    /**
     * @notice Updates MetaData for singe project
     * @param projectID ID of previously created project
     * @param metadata Updated pointer to external metadata
     */
    function updateProjectMetaData(uint96 projectID, MetaPtr memory metadata) external onlyProjectOwner(projectID) {
        projects[projectID].metadata = metadata;
        emit MetaDataUpdated(msg.sender, projectID);
    }

    /**
     * @notice todo
     * @dev todo
     */
    function addProjectOwner(uint96 projectID, address newOwner) external onlyProjectOwner(projectID) {
        require(newOwner != address(0) && newOwner != OWNERS_LIST_SENTINEL && newOwner != address(this), "bad owner");

        OwnerList storage owners = projectsOwners[projectID];

        require(owners.list[newOwner] == address(0), "already owner");

        owners.list[newOwner] = owners.list[OWNERS_LIST_SENTINEL];
        owners.list[OWNERS_LIST_SENTINEL] = newOwner;
        owners.count++;
    }

    /**
     * @notice todo
     * @dev todo
     */
    function removeProjectOwner(uint96 projectID, address prevOwner, address owner) external onlyProjectOwner(projectID) {
        require(owner != address(0) && owner != OWNERS_LIST_SENTINEL, "bad owner");

        OwnerList storage owners = projectsOwners[projectID];

        require(owners.list[prevOwner] == owner, "bad prevOwner");
        require(owners.count > 1, "single owner");

        owners.list[prevOwner] = owners.list[owner];
        delete owners.list[owner];
        owners.count--;
    }

    // Public functions

    /**
     * @notice todo
     * @dev todo
     */
    function projectOwnersCount(uint96 projectID) public view returns(uint256) {
        return projectsOwners[projectID].count;
    }

    /**
     * @notice todo
     * @dev todo
     */
    function getProjectOwners(uint96 projectID) public view returns(address[] memory) {
        OwnerList storage owners = projectsOwners[projectID];

        address[] memory list = new address[](owners.count);

        uint256 index = 0;
        address current = owners.list[OWNERS_LIST_SENTINEL];

        if (current == address(0x0)) {
            return list;
        }

        while (current != OWNERS_LIST_SENTINEL) {
            list[index] = current;
            current = owners.list[current];
            index++;
        }

        return list;
    }

    // Internal functions

    /**
     * @notice todo
     * @dev todo
     */
    function initProjectOwners(uint96 projectID) internal {
        OwnerList storage owners = projectsOwners[projectID];

        owners.list[OWNERS_LIST_SENTINEL] = msg.sender;
        owners.list[msg.sender] = OWNERS_LIST_SENTINEL;
        owners.count = 1;
    }

    // Private functions
    // ...
}
