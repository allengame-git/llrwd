import { Extension } from '@tiptap/core';
import { CommandProps } from '@tiptap/core';

export interface IndentOptions {
    types: string[];
    indentLevels: number[];
    defaultIndentLevel: number;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        indent: {
            /**
             * Increase indent level
             */
            indent: () => ReturnType;
            /**
             * Decrease indent level
             */
            outdent: () => ReturnType;
        };
    }
}

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const Indent = Extension.create<IndentOptions>({
    name: 'indent',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
            indentLevels: [0, 40, 80, 120, 160, 200],
            defaultIndentLevel: 0,
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    indent: {
                        default: this.options.defaultIndentLevel,
                        renderHTML: (attributes: { indent?: number }) => {
                            if (!attributes.indent || attributes.indent === 0) {
                                return {};
                            }
                            return {
                                style: `margin-left: ${attributes.indent}px`,
                            };
                        },
                        parseHTML: (element: HTMLElement) => {
                            const marginLeft = element.style.marginLeft;
                            if (marginLeft) {
                                const value = parseInt(marginLeft, 10);
                                return isNaN(value) ? 0 : value;
                            }
                            return 0;
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        const setIndent = (change: number) => {
            return ({ tr, state, dispatch }: CommandProps) => {
                const { selection } = state;
                const { from, to } = selection;
                const indentLevels = this.options.indentLevels;

                let changed = false;

                state.doc.nodesBetween(from, to, (node, pos) => {
                    if (this.options.types.includes(node.type.name)) {
                        const currentIndent = (node.attrs.indent as number) || 0;
                        const currentIndex = indentLevels.indexOf(currentIndent);
                        const actualIndex = currentIndex === -1 ? 0 : currentIndex;
                        const newIndex = clamp(actualIndex + change, 0, indentLevels.length - 1);
                        const newIndent = indentLevels[newIndex];

                        if (newIndent !== currentIndent) {
                            tr.setNodeMarkup(pos, undefined, {
                                ...node.attrs,
                                indent: newIndent,
                            });
                            changed = true;
                        }
                    }
                });

                if (changed && dispatch) {
                    dispatch(tr);
                }

                return changed;
            };
        };

        return {
            indent: () => setIndent(1),
            outdent: () => setIndent(-1),
        };
    },

    addKeyboardShortcuts() {
        return {
            Tab: () => {
                // Only handle Tab for paragraphs/headings, not lists
                if (this.editor.isActive('listItem')) {
                    return false;
                }
                return this.editor.commands.indent();
            },
            'Shift-Tab': () => {
                // Only handle Shift-Tab for paragraphs/headings, not lists
                if (this.editor.isActive('listItem')) {
                    return false;
                }
                return this.editor.commands.outdent();
            },
        };
    },
});
