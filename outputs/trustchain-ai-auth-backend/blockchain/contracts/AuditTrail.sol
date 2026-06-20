// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title TrustChain AI Audit Trail
/// @notice Stores tamper-evident hashes and references for critical security events only.
/// @dev Do not store PII, customer secrets, documents, IP addresses, or raw payloads on-chain.
contract AuditTrail {
    enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    struct AuditRecord {
        bytes32 auditId;
        bytes32 userId;
        bytes32 eventType;
        RiskLevel riskLevel;
        bytes32 eventHash;
        uint256 timestamp;
        address writer;
        bool exists;
    }

    address public owner;
    mapping(address => bool) public backendWriters;
    mapping(bytes32 => AuditRecord) private records;
    bytes32[] private auditIds;

    event BackendWriterUpdated(address indexed writer, bool allowed);
    event AuditRecorded(
        bytes32 indexed auditId,
        bytes32 indexed userId,
        bytes32 indexed eventType,
        RiskLevel riskLevel,
        bytes32 eventHash,
        uint256 timestamp,
        address writer
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotBackendWriter();
    error AuditAlreadyExists(bytes32 auditId);
    error AuditNotFound(bytes32 auditId);
    error InvalidZeroValue();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyBackendWriter() {
        if (!backendWriters[msg.sender]) revert NotBackendWriter();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert InvalidZeroValue();
        owner = initialOwner;
        backendWriters[initialOwner] = true;
        emit BackendWriterUpdated(initialOwner, true);
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function setBackendWriter(address writer, bool allowed) external onlyOwner {
        if (writer == address(0)) revert InvalidZeroValue();
        backendWriters[writer] = allowed;
        emit BackendWriterUpdated(writer, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidZeroValue();
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function recordAudit(
        bytes32 auditId,
        bytes32 userId,
        bytes32 eventType,
        RiskLevel riskLevel,
        bytes32 eventHash
    ) external onlyBackendWriter {
        if (
            auditId == bytes32(0) ||
            userId == bytes32(0) ||
            eventType == bytes32(0) ||
            eventHash == bytes32(0)
        ) {
            revert InvalidZeroValue();
        }

        if (records[auditId].exists) revert AuditAlreadyExists(auditId);

        records[auditId] = AuditRecord({
            auditId: auditId,
            userId: userId,
            eventType: eventType,
            riskLevel: riskLevel,
            eventHash: eventHash,
            timestamp: block.timestamp,
            writer: msg.sender,
            exists: true
        });

        auditIds.push(auditId);
        emit AuditRecorded(auditId, userId, eventType, riskLevel, eventHash, block.timestamp, msg.sender);
    }

    function getAudit(bytes32 auditId) external view returns (AuditRecord memory) {
        if (!records[auditId].exists) revert AuditNotFound(auditId);
        return records[auditId];
    }

    function verifyAudit(bytes32 auditId, bytes32 expectedEventHash) external view returns (bool) {
        if (!records[auditId].exists) return false;
        return records[auditId].eventHash == expectedEventHash;
    }

    function auditCount() external view returns (uint256) {
        return auditIds.length;
    }

    function getAuditIdAt(uint256 index) external view returns (bytes32) {
        return auditIds[index];
    }
}
