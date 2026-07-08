import { Skeleton } from "@coreModule/components/uiKit/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@coreModule/components/uiKit/ui/table";

export default function SkeletonTable() {
  return (
    <div className="rounded-lg border">
      <Table className="mx-auto lg:max-w-lg">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-3 w-[100px]" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-3 w-[100px]" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-3 w-[100px]" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-3 w-[100px]" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[100px]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[100px]" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
