using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using SOH_LaunchPad_Approval.common;
using Newtonsoft.Json;
using System.Data;
using System.Reflection;

namespace SOH_LaunchPad_Approval.pricing.src
{
    public class DAO
    {
        public DataTable List(string userid)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PRICING_DISPLAY");
                rfcFunction.SetValue("I_BNAME", userid.ToUpper());

                rfcFunction.Invoke(destination);

                IRfcTable rtable = rfcFunction.GetTable("I_SODATA");
                var dt = SAPHelper.GetDataTableFromRfcTable(rtable);

                return dt;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }

        public int GetCount(string userid)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PRICING_DISPLAY");
                rfcFunction.SetValue("I_BNAME", userid.ToUpper());

                rfcFunction.Invoke(destination);

                IRfcTable rtable = rfcFunction.GetTable("I_SODATA");

                return rtable.RowCount;
            }
            catch (Exception ex)
            {
                return 0;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }

        public PricingApproveDetail GetDetail(string so)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PRICING_DETAIL");
                rfcFunction.SetValue("I_VBELN", so.ToUpper());

                rfcFunction.Invoke(destination);

                PricingApproveDetail pad = new PricingApproveDetail();
                PropertyInfo[] properties = typeof(PricingApproveDetail).GetProperties();
                foreach (PropertyInfo property in properties)
                {
                    IRfcTable rtable = rfcFunction.GetTable(property.Name);
                    var dt = SAPHelper.GetDataTableFromRfcTable(rtable);
                    property.SetValue(pad, dt);
                }

                return pad;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }

        public DataTable Approve(string userid, List<soapproval.src.SOApproveRst> rst)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PRICING_APPROVE");
                rfcFunction.SetValue("I_BNAME", userid.ToUpper());

                IRfcTable rtable = rfcFunction.GetTable("TT_RSLT");
                foreach (var r in rst)
                {
                    IRfcStructure itemRow = sapRfcRepository.GetStructureMetadata("ZSO_APPROVE").CreateStructure();
                    itemRow.SetValue("Vbeln", r.Vbeln);
                    rtable.Insert(itemRow);
                }

                rfcFunction.Invoke(destination);

                rtable = rfcFunction.GetTable("TT_RSLT");
                var dt = SAPHelper.GetDataTableFromRfcTable(rtable);

                return dt;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }
    }

    public class PricingApproveDetail
    {
        public DataTable T_GRID { get; set; } //ZSO_PRICING_DETAIL
        public DataTable T_GROUP { get; set; } //ZSO_PRICING_DETAIL
        public DataTable T_HEAD { get; set; } //ZSO_PRICING_HEAD
        public DataTable T_ITEM { get; set; }//ZSO_PRICING_ITEM
        public DataTable T_ITEM_GRID { get; set; }//ZSO_PRICING_DETAIL
        public DataTable T_MAT { get; set; }//ZSO_PRICING_MAT
        public DataTable T_PO { get; set; } //ZSO_PRICING_PO
        public DataTable T_PO_GROUP { get; set; } //ZSO_PRICING_DETAIL
        public DataTable T_ZCKB { get; set; } //ZSO_PRICING_KONV
    }
}