using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace pim360_export
{

    public class ExportActivityResponse
    {
        public ExportActivity response { get; set; }
    }
    public class ExportActivity
    {
        public string username { get; set; }
        public string user_handle { get; set; }
        public string act_name { get; set; }
        public string act_type { get; set; }
        public string act_id { get; set; }
        public string export_mode { get; set; }
        public string export_typed { get; set; }
        public string object_type { get; set; }
        public string delimiter { get; set; }
        public string eic_handle { get; set; }
        public string target_handle { get; set; }
        public string missing_value { get; set; }
        public string query { get; set; }
        public string concat_uom { get; set; }
        public string output_name { get; set; }
        public string act_handle { get; set; }

    }
}
