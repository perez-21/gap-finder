import { PrismaPg } from "@prisma/adapter-pg";
import { academic_level, PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
	console.log("Seeding topics and topic dependencies...");

	// ── Foundation Topics ──────────────────────────────────────────────────────
	const [F01, F02, F03, F04, F05, F06, F07] = await Promise.all([
		prisma.topic.create({
			data: { title: "Basic Arithmetic (integers, fractions, decimals)", curriculum_level: academic_level.foundation },
		}),
		prisma.topic.create({
			data: { title: "Number Properties (factors, multiples, primes)", curriculum_level: academic_level.foundation },
		}),
		prisma.topic.create({
			data: {
				title: "Basic Algebra (variables, expressions, substitution)",
				curriculum_level: academic_level.foundation,
			},
		}),
		prisma.topic.create({
			data: { title: "Basic Geometry (angles, lines, shapes)", curriculum_level: academic_level.foundation },
		}),
		prisma.topic.create({ data: { title: "Ratio & Proportion", curriculum_level: academic_level.foundation } }),
		prisma.topic.create({ data: { title: "Percentages", curriculum_level: academic_level.foundation } }),
		prisma.topic.create({
			data: { title: "Basic Statistics (mean, median, mode)", curriculum_level: academic_level.foundation },
		}),
	]);
	console.log("✓ Foundation topics created");

	// ── SS1 Topics ─────────────────────────────────────────────────────────────
	const [S101, S102, S103, S104, S105, S106, S107, S108, S109, S110, S111, S112, S113, S114, S115] = await Promise.all([
		prisma.topic.create({ data: { title: "Number Bases", curriculum_level: academic_level.ss1 } }),
		prisma.topic.create({ data: { title: "Modular Arithmetic", curriculum_level: academic_level.ss1 } }),
		prisma.topic.create({ data: { title: "Indices & Standard Form", curriculum_level: academic_level.ss1 } }),
		prisma.topic.create({ data: { title: "Surds", curriculum_level: academic_level.ss1 } }),
		prisma.topic.create({
			data: { title: "Algebraic Expressions & Factorisation", curriculum_level: academic_level.ss1 },
		}),
		prisma.topic.create({ data: { title: "Simple Linear Equations", curriculum_level: academic_level.ss1 } }),
		prisma.topic.create({ data: { title: "Linear Inequalities", curriculum_level: academic_level.ss1 } }),
		prisma.topic.create({ data: { title: "Simultaneous Linear Equations", curriculum_level: academic_level.ss1 } }),
		prisma.topic.create({ data: { title: "Change of Subject / Formulae", curriculum_level: academic_level.ss1 } }),
		prisma.topic.create({
			data: { title: "Variation (Direct, Inverse, Joint)", curriculum_level: academic_level.ss1 },
		}),
		prisma.topic.create({
			data: { title: "Plane Geometry (triangles, polygons)", curriculum_level: academic_level.ss1 },
		}),
		prisma.topic.create({ data: { title: "Mensuration I (perimeter, area)", curriculum_level: academic_level.ss1 } }),
		prisma.topic.create({ data: { title: "Sequences & Series (AP/GP intro)", curriculum_level: academic_level.ss1 } }),
		prisma.topic.create({
			data: { title: "Commercial Arithmetic (profit, loss, interest)", curriculum_level: academic_level.ss1 },
		}),
		prisma.topic.create({ data: { title: "Sets", curriculum_level: academic_level.ss1 } }),
	]);
	console.log("✓ SS1 topics created");

	// ── SS2 Topics ─────────────────────────────────────────────────────────────
	const [S201, S202, S203, S204, S205, S206, S207, S208, S209, S210, S211, S212, S213, S214, S215] = await Promise.all([
		prisma.topic.create({ data: { title: "Quadratic Equations", curriculum_level: academic_level.ss2 } }),
		prisma.topic.create({ data: { title: "Quadratic Graphs & Functions", curriculum_level: academic_level.ss2 } }),
		prisma.topic.create({ data: { title: "Polynomials & Remainder Theorem", curriculum_level: academic_level.ss2 } }),
		prisma.topic.create({
			data: { title: "Rational Functions & Partial Fractions", curriculum_level: academic_level.ss2 },
		}),
		prisma.topic.create({ data: { title: "Logarithms", curriculum_level: academic_level.ss2 } }),
		prisma.topic.create({ data: { title: "Linear & Quadratic Inequalities", curriculum_level: academic_level.ss2 } }),
		prisma.topic.create({
			data: { title: "Coordinate Geometry I (lines, gradients)", curriculum_level: academic_level.ss2 },
		}),
		prisma.topic.create({
			data: { title: "Simultaneous Equations (one linear, one quadratic)", curriculum_level: academic_level.ss2 },
		}),
		prisma.topic.create({
			data: { title: "Trigonometry I (SOH CAH TOA, angles)", curriculum_level: academic_level.ss2 },
		}),
		prisma.topic.create({
			data: { title: "Mensuration II (circles, cylinders, cones)", curriculum_level: academic_level.ss2 },
		}),
		prisma.topic.create({
			data: { title: "Probability I (basic, single events)", curriculum_level: academic_level.ss2 },
		}),
		prisma.topic.create({
			data: { title: "Statistics I (frequency tables, histograms, ogive)", curriculum_level: academic_level.ss2 },
		}),
		prisma.topic.create({
			data: { title: "Vectors I (2D, addition, scalar mult)", curriculum_level: academic_level.ss2 },
		}),
		prisma.topic.create({
			data: { title: "Matrices I (operations, determinant 2x2)", curriculum_level: academic_level.ss2 },
		}),
		prisma.topic.create({
			data: { title: "Logical Reasoning / Boolean Algebra", curriculum_level: academic_level.ss2 },
		}),
	]);
	console.log("✓ SS2 topics created");

	// ── SS3 Topics ─────────────────────────────────────────────────────────────
	const [S301, S302, S303, S304, S305, S306, S307, S308, S309, S310, S311, S312, S313] = await Promise.all([
		prisma.topic.create({
			data: { title: "Functions (domain, range, inverse, composite)", curriculum_level: academic_level.ss3 },
		}),
		prisma.topic.create({ data: { title: "Differentiation (basic rules)", curriculum_level: academic_level.ss3 } }),
		prisma.topic.create({
			data: { title: "Integration (basic rules, definite)", curriculum_level: academic_level.ss3 },
		}),
		prisma.topic.create({
			data: { title: "Application of Calculus (area under curve, rates)", curriculum_level: academic_level.ss3 },
		}),
		prisma.topic.create({
			data: { title: "Trigonometry II (identities, equations, graphs)", curriculum_level: academic_level.ss3 },
		}),
		prisma.topic.create({
			data: { title: "Coordinate Geometry II (circles, locus)", curriculum_level: academic_level.ss3 },
		}),
		prisma.topic.create({ data: { title: "Vectors II (3D, dot product)", curriculum_level: academic_level.ss3 } }),
		prisma.topic.create({
			data: { title: "Matrices II (inverse, solving systems)", curriculum_level: academic_level.ss3 },
		}),
		prisma.topic.create({
			data: { title: "Sequences & Series (sum to infinity, binomial)", curriculum_level: academic_level.ss3 },
		}),
		prisma.topic.create({
			data: { title: "Probability II (conditional, tree diagrams)", curriculum_level: academic_level.ss3 },
		}),
		prisma.topic.create({
			data: { title: "Statistics II (standard deviation, correlation)", curriculum_level: academic_level.ss3 },
		}),
		prisma.topic.create({
			data: { title: "Transformation Geometry (reflection, rotation etc.)", curriculum_level: academic_level.ss3 },
		}),
		prisma.topic.create({
			data: { title: "Constructed Proofs / Circle Theorems", curriculum_level: academic_level.ss3 },
		}),
	]);
	console.log("✓ SS3 topics created");

	// ── Topic Dependencies ─────────────────────────────────────────────────────
	// Each entry: { topic_id, depends_on_topic_id }
	const deps: Array<{ topic_id: string; depends_on_topic_id: string }> = [
		// SS1
		{ topic_id: S101.id, depends_on_topic_id: F01.id },
		{ topic_id: S101.id, depends_on_topic_id: F02.id },
		{ topic_id: S102.id, depends_on_topic_id: F01.id },
		{ topic_id: S102.id, depends_on_topic_id: F02.id },
		{ topic_id: S103.id, depends_on_topic_id: F01.id },
		{ topic_id: S103.id, depends_on_topic_id: F02.id },
		{ topic_id: S104.id, depends_on_topic_id: F01.id },
		{ topic_id: S104.id, depends_on_topic_id: S103.id },
		{ topic_id: S105.id, depends_on_topic_id: F03.id },
		{ topic_id: S106.id, depends_on_topic_id: F03.id },
		{ topic_id: S107.id, depends_on_topic_id: S106.id },
		{ topic_id: S108.id, depends_on_topic_id: S106.id },
		{ topic_id: S109.id, depends_on_topic_id: S106.id },
		{ topic_id: S110.id, depends_on_topic_id: F05.id },
		{ topic_id: S110.id, depends_on_topic_id: S106.id },
		{ topic_id: S111.id, depends_on_topic_id: F04.id },
		{ topic_id: S112.id, depends_on_topic_id: F01.id },
		{ topic_id: S112.id, depends_on_topic_id: F04.id },
		{ topic_id: S112.id, depends_on_topic_id: F05.id },
		{ topic_id: S113.id, depends_on_topic_id: F01.id },
		{ topic_id: S113.id, depends_on_topic_id: F03.id },
		{ topic_id: S114.id, depends_on_topic_id: F01.id },
		{ topic_id: S114.id, depends_on_topic_id: F06.id },
		{ topic_id: S115.id, depends_on_topic_id: F01.id },
		{ topic_id: S115.id, depends_on_topic_id: F02.id },

		// SS2
		{ topic_id: S201.id, depends_on_topic_id: S105.id },
		{ topic_id: S201.id, depends_on_topic_id: S106.id },
		{ topic_id: S202.id, depends_on_topic_id: S201.id },
		{ topic_id: S203.id, depends_on_topic_id: S105.id },
		{ topic_id: S203.id, depends_on_topic_id: S201.id },
		{ topic_id: S204.id, depends_on_topic_id: S203.id },
		{ topic_id: S205.id, depends_on_topic_id: S103.id },
		{ topic_id: S206.id, depends_on_topic_id: S107.id },
		{ topic_id: S206.id, depends_on_topic_id: S201.id },
		{ topic_id: S207.id, depends_on_topic_id: S106.id },
		{ topic_id: S207.id, depends_on_topic_id: S111.id },
		{ topic_id: S208.id, depends_on_topic_id: S108.id },
		{ topic_id: S208.id, depends_on_topic_id: S201.id },
		{ topic_id: S209.id, depends_on_topic_id: S111.id },
		{ topic_id: S209.id, depends_on_topic_id: S112.id },
		{ topic_id: S210.id, depends_on_topic_id: S112.id },
		{ topic_id: S211.id, depends_on_topic_id: F07.id },
		{ topic_id: S211.id, depends_on_topic_id: S115.id },
		{ topic_id: S212.id, depends_on_topic_id: F07.id },
		{ topic_id: S213.id, depends_on_topic_id: F01.id },
		{ topic_id: S213.id, depends_on_topic_id: S111.id },
		{ topic_id: S214.id, depends_on_topic_id: F03.id },
		{ topic_id: S214.id, depends_on_topic_id: S108.id },
		{ topic_id: S215.id, depends_on_topic_id: S115.id },

		// SS3
		{ topic_id: S301.id, depends_on_topic_id: S202.id },
		{ topic_id: S301.id, depends_on_topic_id: S105.id },
		{ topic_id: S302.id, depends_on_topic_id: S202.id },
		{ topic_id: S302.id, depends_on_topic_id: S207.id },
		{ topic_id: S303.id, depends_on_topic_id: S302.id },
		{ topic_id: S304.id, depends_on_topic_id: S303.id },
		{ topic_id: S305.id, depends_on_topic_id: S209.id },
		{ topic_id: S306.id, depends_on_topic_id: S207.id },
		{ topic_id: S306.id, depends_on_topic_id: S210.id },
		{ topic_id: S307.id, depends_on_topic_id: S213.id },
		{ topic_id: S308.id, depends_on_topic_id: S214.id },
		{ topic_id: S308.id, depends_on_topic_id: S108.id },
		{ topic_id: S309.id, depends_on_topic_id: S113.id },
		{ topic_id: S309.id, depends_on_topic_id: S103.id },
		{ topic_id: S310.id, depends_on_topic_id: S211.id },
		{ topic_id: S311.id, depends_on_topic_id: S212.id },
		{ topic_id: S312.id, depends_on_topic_id: S111.id },
		{ topic_id: S312.id, depends_on_topic_id: S213.id },
		{ topic_id: S313.id, depends_on_topic_id: S111.id },
		{ topic_id: S313.id, depends_on_topic_id: S209.id },
	];

	await prisma.topicDependency.createMany({ data: deps });
	console.log(`✓ ${deps.length} topic dependencies created`);

	console.log("\nSeeding complete.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
