export type ToolParameterType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "object";

export interface ToolParameterSchema {
  readonly type: ToolParameterType;
  readonly description?: string;
  readonly enum?: readonly string[];
  readonly items?: ToolParameterSchema;
  readonly properties?: Readonly<Record<string, ToolParameterSchema>>;
  readonly required?: readonly string[];
}

export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly parameters: ToolParameterSchema;
}
