/** 站点级配置：按公司实际情况修改 */
export const SITE = {
  name: "IT 知识库",
  fullName: "IT 知识库与故障排查",
  description: "公司内部常见问题检索与分步排查指南",
  /** 找不到答案时的求助渠道 */
  support: {
    label: "IT 服务台",
    contact: "分机 8000 · it-helpdesk@example.com",
  },
} as const;
