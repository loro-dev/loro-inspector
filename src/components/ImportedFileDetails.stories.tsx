import type { Meta, StoryObj } from '@storybook/react';
import { ImportedFileDetails } from './ImportedFileDetails';
import { OpId, VersionVector } from "loro-crdt";

// Mock version vector for stories
class MockVersionVector {
    private map: Map<string, number>;

    constructor(entries: [string, number][]) {
        this.map = new Map(entries);
    }

    toJSON() {
        return this.map;
    }
}

// Mock OpId for stories
class MockOpId {
    constructor(public readonly id: string) { }

    toString() {
        return this.id;
    }
}

const meta: Meta<typeof ImportedFileDetails> = {
    title: 'Components/ImportedFileDetails',
    component: ImportedFileDetails,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ImportedFileDetails>;

// Basic example with small data
export const Basic: Story = {
    args: {
        file: {
            name: 'example.loro',
            binary: new Uint8Array(1024), // 1KB file
            lastModified: Date.now() - 86400000, // 1 day ago
            importedTime: Date.now(),
            mode: 'snapshot',
            partialStartVersionVector: new MockVersionVector([
                ['user1', 10],
                ['user2', 5]
            ]) as unknown as VersionVector,
            partialEndVersionVector: new MockVersionVector([
                ['user1', 15],
                ['user2', 8]
            ]) as unknown as VersionVector,
            startFrontiers: [
                new MockOpId('op1') as unknown as OpId,
                new MockOpId('op2') as unknown as OpId
            ],
            startTimestamp: Date.now() - 3600000, // 1 hour ago
            endTimestamp: Date.now(),
            changeNum: 5
        }
    }
};

// Example with many entries in vectors
export const WithLargeVectors: Story = {
    args: {
        file: {
            name: 'large-example.loro',
            binary: new Uint8Array(5 * 1024 * 1024), // 5MB file
            lastModified: Date.now() - 604800000, // 1 week ago
            importedTime: Date.now(),
            mode: 'update',
            partialStartVersionVector: new MockVersionVector(
                Array.from({ length: 20 }, (_, i) => [`user${i}`, i * 10])
            ) as unknown as VersionVector,
            partialEndVersionVector: new MockVersionVector(
                Array.from({ length: 20 }, (_, i) => [`user${i}`, i * 10 + 5])
            ) as unknown as VersionVector,
            startFrontiers: Array.from(
                { length: 30 },
                (_, i) => new MockOpId(`op${i}`) as unknown as OpId
            ),
            startTimestamp: Date.now() - 86400000, // 1 day ago
            endTimestamp: Date.now(),
            changeNum: 120
        }
    }
};

// Example with minimal data
export const Minimal: Story = {
    args: {
        file: {
            name: 'minimal.loro',
            binary: new Uint8Array(100),
            lastModified: Date.now(),
            importedTime: Date.now(),
            mode: 'shallow-snapshot',
            partialStartVersionVector: new MockVersionVector([]) as unknown as VersionVector,
            partialEndVersionVector: new MockVersionVector([]) as unknown as VersionVector,
            startFrontiers: [],
            startTimestamp: Date.now(),
            endTimestamp: Date.now(),
            changeNum: 0
        }
    }
}; 
