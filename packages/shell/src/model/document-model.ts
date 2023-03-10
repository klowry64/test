import {
  IDocumentModel as InnerDocumentModel,
  INode as InnerNode,
} from '@alilc/lowcode-designer';
import {
  IPublicEnumTransformStage,
  IPublicTypeRootSchema,
  GlobalEvent,
  IPublicModelDocumentModel,
  IPublicTypeOnChangeOptions,
  IPublicTypeDragNodeObject,
  IPublicTypeDragNodeDataObject,
  IPublicModelNode,
  IPublicModelSelection,
  IPublicModelDetecting,
  IPublicModelHistory,
  IPublicApiProject,
  IPublicModelModalNodesManager,
  IPublicTypePropChangeOptions,
  IPublicModelDropLocation,
  IPublicApiCanvas,
  IPublicTypeDisposable,
  IPublicModelEditor,
} from '@alilc/lowcode-types';
import { isDragNodeObject } from '@alilc/lowcode-utils';
import { Node as ShellNode } from './node';
import { Selection as ShellSelection } from './selection';
import { Detecting as ShellDetecting } from './detecting';
import { History as ShellHistory } from './history';
import { DropLocation as ShellDropLocation } from './drop-location';
import { Project as ShellProject, Canvas as ShellCanvas } from '../api';
import { Prop as ShellProp } from './prop';
import { ModalNodesManager } from './modal-nodes-manager';
import { documentSymbol, editorSymbol, nodeSymbol } from '../symbols';

const shellDocSymbol = Symbol('shellDocSymbol');

export class DocumentModel implements IPublicModelDocumentModel {
  private readonly [documentSymbol]: InnerDocumentModel;
  private readonly [editorSymbol]: IPublicModelEditor;
  private _focusNode: IPublicModelNode | null;
  selection: IPublicModelSelection;
  detecting: IPublicModelDetecting;
  history: IPublicModelHistory;

  /**
   * @deprecated use canvas API instead
   */
  canvas: IPublicApiCanvas;

  constructor(document: InnerDocumentModel) {
    this[documentSymbol] = document;
    this[editorSymbol] = document.designer?.editor as IPublicModelEditor;
    this.selection = new ShellSelection(document);
    this.detecting = new ShellDetecting(document);
    this.history = new ShellHistory(document);
    this.canvas = new ShellCanvas(this[editorSymbol]);

    this._focusNode = ShellNode.create(this[documentSymbol].focusNode);
  }

  static create(document: InnerDocumentModel | undefined | null): IPublicModelDocumentModel | null {
    if (!document) {
      return null;
    }
    // @ts-ignore ???????????????????????? shell doc ??????
    if (document[shellDocSymbol]) {
      return (document as any)[shellDocSymbol];
    }
    const shellDoc = new DocumentModel(document);
    // @ts-ignore ???????????????????????? shell doc ??????
    document[shellDocSymbol] = shellDoc;
    return shellDoc;
  }

  /**
   * id
   */
  get id(): string {
    return this[documentSymbol].id;
  }

  set id(id) {
    this[documentSymbol].id = id;
  }

  /**
   * ??????????????????????????? project
   * @returns
   */
  get project(): IPublicApiProject {
    return ShellProject.create(this[documentSymbol].project);
  }

  /**
   * ????????????????????????
   * root node of this documentModel
   * @returns
   */
  get root(): IPublicModelNode | null {
    return ShellNode.create(this[documentSymbol].rootNode);
  }

  get focusNode(): IPublicModelNode | null {
    return this._focusNode || this.root;
  }

  set focusNode(node: IPublicModelNode | null) {
    this._focusNode = node;
    this[editorSymbol].eventBus.emit(
      'shell.document.focusNodeChanged',
        { document: this, focusNode: node },
      );
  }

  /**
   * ??????????????????????????? Map, key ??? nodeId
   * get map of all nodes , using node.id as key
   */
  get nodesMap(): Map<string, IPublicModelNode> {
    const map = new Map<string, IPublicModelNode>();
    for (let id of this[documentSymbol].nodesMap.keys()) {
      map.set(id, this.getNodeById(id)!);
    }
    return map;
  }

  /**
   * ??????????????????
   */
  get modalNodesManager(): IPublicModelModalNodesManager | null {
    return ModalNodesManager.create(this[documentSymbol].modalNodesManager);
  }

  get dropLocation(): IPublicModelDropLocation | null {
    return ShellDropLocation.create(this[documentSymbol].dropLocation);
  }

  set dropLocation(loc: IPublicModelDropLocation | null) {
    this[documentSymbol].dropLocation = loc;
  }

  /**
   * ?????? nodeId ?????? Node ??????
   * get node instance by nodeId
   * @param {string} nodeId
   */
  getNodeById(nodeId: string): IPublicModelNode | null {
    return ShellNode.create(this[documentSymbol].getNode(nodeId));
  }

  /**
   * ?????? schema
   * @param schema
   */
  importSchema(schema: IPublicTypeRootSchema): void {
    this[documentSymbol].import(schema);
    this[editorSymbol].eventBus.emit('shell.document.importSchema', schema);
  }

  /**
   * ?????? schema
   * @param stage
   * @returns
   */
  exportSchema(stage: IPublicEnumTransformStage = IPublicEnumTransformStage.Render): any {
    return this[documentSymbol].export(stage);
  }

  /**
   * ????????????
   * @param parent
   * @param thing
   * @param at
   * @param copy
   * @returns
   */
  insertNode(
    parent: IPublicModelNode,
    thing: IPublicModelNode,
    at?: number | null | undefined,
    copy?: boolean | undefined,
  ): IPublicModelNode | null {
    const node = this[documentSymbol].insertNode(
      (parent as any)[nodeSymbol] ? (parent as any)[nodeSymbol] : parent,
      (thing as any)?.[nodeSymbol] ? (thing as any)[nodeSymbol] : thing,
      at,
      copy,
    );
    return ShellNode.create(node);
  }

  /**
   * ??????????????????
   * @param data
   * @returns
   */
  createNode(data: any): IPublicModelNode | null {
    return ShellNode.create(this[documentSymbol].createNode(data));
  }

  /**
   * ??????????????????/??????id
   * @param idOrNode
   */
  removeNode(idOrNode: string | IPublicModelNode): void {
    this[documentSymbol].removeNode(idOrNode as any);
  }

  /**
   * componentsMap of documentModel
   * @param extraComps
   * @returns
   */
  getComponentsMap(extraComps?: string[]): any {
    return this[documentSymbol].getComponentsMap(extraComps);
  }

  /**
   * ??????????????????????????????????????????????????????????????????
   * @param dropTarget ???????????????????????????
   * @param dragObject ???????????????
   * @returns boolean ??????????????????
   */
  checkNesting(
      dropTarget: IPublicModelNode,
      dragObject: IPublicTypeDragNodeObject | IPublicTypeDragNodeDataObject,
    ): boolean {
    let innerDragObject = dragObject;
    if (isDragNodeObject(dragObject)) {
      innerDragObject.nodes = innerDragObject.nodes?.map(
          (node: IPublicModelNode) => ((node as any)[nodeSymbol] || node),
        );
    }
    return this[documentSymbol].checkNesting(
      ((dropTarget as any)[nodeSymbol] || dropTarget) as any,
      innerDragObject as any,
    );
  }

  /**
   * ?????? document ??????????????????
   */
  onAddNode(fn: (node: IPublicModelNode) => void): IPublicTypeDisposable {
    return this[documentSymbol].onNodeCreate((node: InnerNode) => {
      fn(ShellNode.create(node)!);
    });
  }

  /**
   * ?????? document ???????????????????????????????????????????????? document ???
   */
  onMountNode(fn: (payload: { node: IPublicModelNode }) => void): IPublicTypeDisposable {
    this[editorSymbol].eventBus.on('node.add', fn as any);
    return () => {
      this[editorSymbol].eventBus.off('node.add', fn as any);
    };
  }

  /**
   * ?????? document ??????????????????
   */
  onRemoveNode(fn: (node: IPublicModelNode) => void): IPublicTypeDisposable {
    return this[documentSymbol].onNodeDestroy((node: InnerNode) => {
      fn(ShellNode.create(node)!);
    });
  }

  /**
   * ?????? document ??? hover ????????????
   */
  onChangeDetecting(fn: (node: IPublicModelNode) => void): IPublicTypeDisposable {
    return this[documentSymbol].designer.detecting.onDetectingChange((node: InnerNode) => {
      fn(ShellNode.create(node)!);
    });
  }

  /**
   * ?????? document ?????????????????????
   */
  onChangeSelection(fn: (ids: string[]) => void): IPublicTypeDisposable {
    return this[documentSymbol].selection.onSelectionChange((ids: string[]) => {
      fn(ids);
    });
  }

  /**
   * ?????? document ?????????????????????????????????
   * @param fn
   */
  onChangeNodeVisible(fn: (node: IPublicModelNode, visible: boolean) => void): IPublicTypeDisposable {
    return this[documentSymbol].onChangeNodeVisible((node: IPublicModelNode, visible: boolean) => {
      fn(ShellNode.create(node)!, visible);
    });
  }

  /**
   * ?????? document ????????? children ????????????
   * @param fn
   */
  onChangeNodeChildren(fn: (info: IPublicTypeOnChangeOptions) => void): IPublicTypeDisposable {
    return this[documentSymbol].onChangeNodeChildren((info?: IPublicTypeOnChangeOptions) => {
      if (!info) {
        return;
      }
      fn({
        type: info.type,
        node: ShellNode.create(info.node)!,
      });
    });
  }

  /**
   * ?????? document ????????????????????????
   * @param fn
   */
  onChangeNodeProp(fn: (info: IPublicTypePropChangeOptions) => void): IPublicTypeDisposable {
    const callback = (info: GlobalEvent.Node.Prop.ChangeOptions) => {
      fn({
        key: info.key,
        oldValue: info.oldValue,
        newValue: info.newValue,
        prop: ShellProp.create(info.prop)!,
        node: ShellNode.create(info.node as any)!,
      });
    };
    this[editorSymbol].on(
      GlobalEvent.Node.Prop.InnerChange,
      callback,
    );

    return () => {
      this[editorSymbol].off(
        GlobalEvent.Node.Prop.InnerChange,
        callback,
      );
    };
  }

  /**
   * import schema event
   * @param fn
   */
  onImportSchema(fn: (schema: IPublicTypeRootSchema) => void): IPublicTypeDisposable {
    return this[editorSymbol].eventBus.on('shell.document.importSchema', fn as any);
  }

  isDetectingNode(node: IPublicModelNode): boolean {
    return this.detecting.current === node;
  }

  onFocusNodeChanged(
    fn: (doc: IPublicModelDocumentModel, focusNode: IPublicModelNode) => void,
  ): IPublicTypeDisposable {
    if (!fn) {
      return () => {};
    }
    return this[editorSymbol].eventBus.on(
      'shell.document.focusNodeChanged',
      (payload) => {
        const { document, focusNode } = payload;
        fn(document, focusNode);
      },
    );
  }

  onDropLocationChanged(fn: (doc: IPublicModelDocumentModel) => void): IPublicTypeDisposable {
    if (!fn) {
      return () => {};
    }
    return this[editorSymbol].eventBus.on(
      'document.dropLocation.changed',
      (payload) => {
        const { document } = payload;
        fn(document);
      },
    );
  }
}
