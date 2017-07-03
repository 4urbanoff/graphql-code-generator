import { FlattenDocument, FlattenFragment, FlattenModel, FlattenOperation } from './types';
import {
  Document, Fragment, isFieldNode, Operation, SelectionSetFieldNode,
  SelectionSetItem
} from 'graphql-codegen-core';
import { pascalCase } from 'change-case';

export const handleNameDuplications = (name: string, existing: FlattenModel[]): string => {
  if (existing.find(model => model.modelType === name)) {
    return handleNameDuplications('_' + name, existing);
  }

  return name;
};

function buildModelFromField(field: SelectionSetFieldNode, result: FlattenModel[]): FlattenModel {
  const modelName = handleNameDuplications(pascalCase(field.name), result);

  return {
    modelType: modelName,
    fields: field.fields,
    fragmentsSpread: field.fragmentsSpread,
    inlineFragments: field.inlineFragments,
    hasFields: field.hasFields,
    hasFragmentsSpread: field.hasFragmentsSpread,
    hasInlineFragments: field.hasInlineFragments,
  };
}

function flattenSelectionSet(selectionSet: SelectionSetItem[], result: FlattenModel[] = []): FlattenModel[] {
  selectionSet.forEach((item: SelectionSetItem) => {
    if (isFieldNode(item)) {
      if (item.selectionSet.length > 0) {
        const model = buildModelFromField(item, result);
        item.type = model.modelType;
        result.push(model);

        flattenSelectionSet(item.selectionSet, result);
      }
    }
  });

  return result;
}

export function flattenTypes(document: Document): FlattenDocument {
  return {
    operations: document.operations.map<FlattenOperation>((operation: Operation): FlattenOperation => {
      return {
        ...operation,
        innerModels: flattenSelectionSet(operation.selectionSet),
      } as FlattenOperation;
    }),
    fragments: document.fragments.map<FlattenFragment>((fragment: Fragment): FlattenFragment => {
      return {
        ...fragment,
        innerModels: flattenSelectionSet(fragment.selectionSet),
      } as FlattenFragment;
    }),
    hasOperations: document.hasOperations,
    hasFragments: document.hasFragments,
  };
}
